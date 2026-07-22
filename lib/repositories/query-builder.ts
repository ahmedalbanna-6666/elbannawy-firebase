import { RepositoryError, RepositoryResult } from '../shared/types/repository.types';
import { Page } from '../shared/types/pagination.types';
import { ICursor } from '../shared/types/cursor.types';
import { IFilter } from '../shared/types/filter.types';
import { TransactionManager } from './transactions/transaction-manager';
import { getFirestoreInstance } from './firestore/firestore.service';

interface FilterCondition {
  field: string;
  operator: string;
  value: unknown;
}

interface OrderCondition {
  field: string;
  direction: 'asc' | 'desc';
}

export class QueryBuilder<T> {
  private readonly filterConditions: FilterCondition[] = [];
  private readonly orderConditions: OrderCondition[] = [];
  private pageLimit?: number;
  private pageCursor?: ICursor;
  private fieldProjections?: string[];
  private txnId?: string;

  constructor(_transactionManager?: TransactionManager) {}

  withFilter(field: string, operator: string, value: unknown): QueryBuilder<T> {
    this.filterConditions.push({ field, operator, value });
    return this;
  }

  withFilterObject(filter: IFilter): QueryBuilder<T> {
    for (const [field, condition] of Object.entries(filter)) {
      for (const [operator, value] of Object.entries(condition as Record<string, unknown>)) {
        this.filterConditions.push({ field, operator, value });
      }
    }
    return this;
  }

  withOrderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    this.orderConditions.push({ field, direction });
    return this;
  }

  withLimit(count: number): QueryBuilder<T> {
    this.pageLimit = count;
    return this;
  }

  withCursor(cursor: ICursor): QueryBuilder<T> {
    this.pageCursor = cursor;
    return this;
  }

  withProjections(fields: string[]): QueryBuilder<T> {
    this.fieldProjections = fields;
    return this;
  }

  withTransaction(transactionId: string): QueryBuilder<T> {
    this.txnId = transactionId;
    return this;
  }

  getFilters(): readonly FilterCondition[] {
    return this.filterConditions;
  }

  getOrderBy(): readonly OrderCondition[] {
    return this.orderConditions;
  }

  getLimit(): number | undefined {
    return this.pageLimit;
  }

  getCursor(): ICursor | undefined {
    return this.pageCursor;
  }

  getProjections(): string[] | undefined {
    return this.fieldProjections;
  }

  getTransactionId(): string | undefined {
    return this.txnId;
  }

  async execute(collection: string): Promise<RepositoryResult<Page<T>>> {
    try {
      const db = getFirestoreInstance();
      let query: FirebaseFirestore.Query = db.collection(collection) as unknown as FirebaseFirestore.Query;

      if (this.filterConditions.length > 0) {
        query = this.applyFilters(query);
      }

      if (this.orderConditions.length > 0) {
        query = this.applyOrderBy(query);
      }

      if (this.pageLimit) {
        query = query.limit(this.pageLimit);
      }

      if (this.pageCursor) {
        query = this.applyCursor(query);
      }

      if (this.fieldProjections && this.fieldProjections.length > 0) {
        query = this.applyProjections(query);
      }

      const snapshot = await query.get();
      const items = this.transformDocuments(snapshot);
      const nextCursor = this.createNextCursor(snapshot, items);

      const nextCursorStr = nextCursor
        ? JSON.stringify(nextCursor)
        : null;

      return { ok: true, value: { items, nextCursor: nextCursorStr } };
    } catch (error) {
      return this.formatError(error as Error);
    }
  }

  private applyFilters(query: FirebaseFirestore.Query): FirebaseFirestore.Query {
    let q = query;
    for (const { field, operator, value } of this.filterConditions) {
      switch (operator) {
        case 'eq':
          q = q.where(field, '==', value);
          break;
        case 'ne':
          q = q.where(field, '!=', value);
          break;
        case 'gt':
          q = q.where(field, '>', value);
          break;
        case 'gte':
          q = q.where(field, '>=', value);
          break;
        case 'lt':
          q = q.where(field, '<', value);
          break;
        case 'lte':
          q = q.where(field, '<=', value);
          break;
        case 'in':
          q = q.where(field, 'in', value);
          break;
        case 'not-in':
          q = q.where(field, 'not-in', value);
          break;
        case 'array-contains':
          q = q.where(field, 'array-contains', value);
          break;
        case 'array-contains-any':
          q = q.where(field, 'array-contains-any', value);
          break;
      }
    }
    return q;
  }

  private applyOrderBy(query: FirebaseFirestore.Query): FirebaseFirestore.Query {
    let q = query;
    for (const { field, direction } of this.orderConditions) {
      q = q.orderBy(field, direction);
    }
    return q;
  }

  private applyCursor(query: FirebaseFirestore.Query): FirebaseFirestore.Query {
    return query.startAfter(this.pageCursor!.value);
  }

  private applyProjections(query: FirebaseFirestore.Query): FirebaseFirestore.Query {
    if (this.fieldProjections && this.fieldProjections.length > 0) {
      return query.select(...this.fieldProjections);
    }
    return query;
  }

  private transformDocuments(snapshot: FirebaseFirestore.QuerySnapshot): T[] {
    const items: T[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      items.push({ ...data, id: doc.id } as unknown as T);
    });
    return items;
  }

  private createNextCursor(snapshot: FirebaseFirestore.QuerySnapshot, items: T[]): ICursor | null {
    if (items.length === 0 || snapshot.docs.length === 0) {
      return null;
    }
    const lastDocInDocs = snapshot.docs[snapshot.docs.length - 1];
    if (!lastDocInDocs) {
      return null;
    }
    const lastOrder = this.orderConditions.length > 0
      ? this.orderConditions[this.orderConditions.length - 1]
      : null;
    const lastOrderField = lastOrder?.field ?? 'id';
    return {
      key: lastOrderField,
      value: lastDocInDocs.data(),
    };
  }

  private formatError(error: Error): RepositoryResult<Page<T>> {
    return {
      ok: false,
      error: {
        code: this.mapToRepositoryErrorCode(error),
        message: error.message,
        retryable: false,
        requestId: '',
      },
    };
  }

  private mapToRepositoryErrorCode(error: Error): RepositoryError['code'] {
    if (error.message.includes('permission denied')) {
      return 'FORBIDDEN';
    }
    if (error.message.includes('not found')) {
      return 'NOT_FOUND';
    }
    if (error.message.includes('already exists')) {
      return 'ALREADY_EXISTS';
    }
    return 'INTERNAL';
  }
}
