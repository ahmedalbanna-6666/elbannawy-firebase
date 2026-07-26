import { RepositoryError, RepositoryResult } from '../../shared/types/repository.types';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { Timestamp } from 'firebase-admin/firestore';

export abstract class BaseRepository<T extends { readonly id: string }> {
  protected abstract readonly collection: string;
  protected abstract readonly transactionManager: TransactionManager;

  private getDb() {
    return getFirestoreInstance();
  }

  async create(
    data: Partial<T>,
    requestId?: string,
    _idempotencyKey?: string,
    _transactionId?: string,
  ): Promise<RepositoryResult<T>> {
    try {
      const validation = await this.validateAndCreate(data);
      if (!validation.ok) {
        return this.formatCreateResponse(validation as RepositoryResult<T>, requestId);
      }

      const docId = (data as Record<string, unknown>).id as string;
      if (!docId) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: requestId ?? '' },
        };
      }

      const db = this.getDb();
      const docRef = db.collection(this.collection).doc(docId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        return {
          ok: false,
          error: { code: 'ALREADY_EXISTS', message: `Document ${docId} already exists`, retryable: false, requestId: requestId ?? '' },
        };
      }

      const now = Timestamp.now();
      const firestoreData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(firestoreData);

      const docWithId = { ...firestoreData, id: docId } as unknown as T;

      return { ok: true, value: docWithId };
    } catch (error) {
      return this.formatError(error as Error, requestId);
    }
  }

  async getById(
    id: string,
    requestId?: string,
    _transactionId?: string,
  ): Promise<RepositoryResult<T | null>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: requestId ?? '' },
        };
      }

      const db = this.getDb();
      const docRef = db.collection(this.collection).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { ok: true, value: null };
      }

      const rawData = docSnap.data() as Record<string, unknown>;
      const doc = { ...rawData, id: docSnap.id } as unknown as T;

      const result = await this.validateAndGetById(id, doc);
      return this.formatGetResponse(result, requestId);
    } catch (error) {
      return this.formatError(error as Error, requestId) as unknown as RepositoryResult<T | null>;
    }
  }

  async update(
    id: string,
    data: Partial<T>,
    expectedVersion: number,
    requestId?: string,
    _transactionId?: string,
  ): Promise<RepositoryResult<T>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: requestId ?? '' },
        };
      }

      const validation = await this.validateAndUpdate(id, data, expectedVersion);
      if (!validation.ok) {
        return this.formatCreateResponse(validation as RepositoryResult<T>, requestId);
      }

      const db = this.getDb();
      const docRef = db.collection(this.collection).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Document not found: ${id}`, retryable: false, requestId: requestId ?? '' },
        };
      }

      const now = Timestamp.now();
      const existingData = docSnap.data() as Record<string, unknown>;
      const updateData = {
        ...data,
        updatedAt: now,
      } as Record<string, unknown>;

      await docRef.update(updateData);

      const mergedData = { ...existingData, ...updateData, id };
      return { ok: true, value: mergedData as unknown as T };
    } catch (error) {
      return this.formatError(error as Error, requestId);
    }
  }

  async archive(
    id: string,
    requestId?: string,
    _transactionId?: string,
  ): Promise<RepositoryResult<void>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: requestId ?? '' },
        };
      }

      const validation = await this.validateAndArchive(id);
      if (!validation.ok) {
        return this.formatVoidResponse(validation, requestId);
      }

      const db = this.getDb();
      const docRef = db.collection(this.collection).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Document not found: ${id}`, retryable: false, requestId: requestId ?? '' },
        };
      }

      await docRef.update({
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return { ok: true, value: undefined };
    } catch (error) {
      return this.formatVoidError(error as Error, requestId);
    }
  }

  async restore(
    id: string,
    requestId?: string,
    _transactionId?: string,
  ): Promise<RepositoryResult<void>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: requestId ?? '' },
        };
      }

      const validation = await this.validateAndRestore(id);
      if (!validation.ok) {
        return this.formatVoidResponse(validation, requestId);
      }

      const db = this.getDb();
      const docRef = db.collection(this.collection).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Document not found: ${id}`, retryable: false, requestId: requestId ?? '' },
        };
      }

      await docRef.update({
        deletedAt: null,
        updatedAt: Timestamp.now(),
      });

      return { ok: true, value: undefined };
    } catch (error) {
      return this.formatVoidError(error as Error, requestId);
    }
  }

  async exists(
    id: string,
    _transactionId?: string,
  ): Promise<boolean> {
    try {
      if (!id || id.trim().length === 0) {
        return false;
      }

      const db = this.getDb();
      const docRef = db.collection(this.collection).doc(id);
      const docSnap = await docRef.get();
      return docSnap.exists;
    } catch {
      return false;
    }
  }

  private formatCreateResponse(
    result: RepositoryResult<T>,
    requestId?: string,
  ): RepositoryResult<T> {
    if (!result.ok && result.error) {
      return {
        ...result,
        error: {
          ...result.error,
          requestId: requestId ?? '',
          retryable: this.isRetryableError(result.error.code),
        },
      };
    }
    return result;
  }

  private formatGetResponse(
    result: RepositoryResult<T | null>,
    requestId?: string,
  ): RepositoryResult<T | null> {
    if (!result.ok && result.error) {
      return {
        ...result,
        error: {
          ...result.error,
          requestId: requestId ?? '',
          retryable: this.isRetryableError(result.error.code),
        },
      };
    }
    return result;
  }

  private formatVoidResponse(
    result: RepositoryResult<void>,
    requestId?: string,
  ): RepositoryResult<void> {
    if (!result.ok && result.error) {
      return {
        ...result,
        error: {
          ...result.error,
          requestId: requestId ?? '',
          retryable: this.isRetryableError(result.error.code),
        },
      };
    }
    return result;
  }

  private formatError(error: Error, requestId?: string): RepositoryResult<T> {
    const base = toRepositoryError(error);
    return {
      ok: false,
      error: { ...base, requestId: requestId ?? '' },
    };
  }

  private formatVoidError(error: Error, requestId?: string): RepositoryResult<void> {
    const base = toRepositoryError(error);
    return {
      ok: false,
      error: { ...base, requestId: requestId ?? '' },
    };
  }

  private isRetryableError(code: RepositoryError['code']): boolean {
    return ['UNAVAILABLE', 'CONFLICT'].includes(code);
  }

  protected abstract validateAndCreate(
    data: Partial<T>,
  ): Promise<RepositoryResult<T>>;
  protected abstract validateAndGetById(
    id: string,
    doc: T | null,
  ): Promise<RepositoryResult<T | null>>;
  protected abstract validateAndUpdate(
    id: string,
    data: Partial<T>,
    expectedVersion: number,
  ): Promise<RepositoryResult<T>>;
  protected abstract validateAndArchive(
    id: string,
  ): Promise<RepositoryResult<void>>;
  protected abstract validateAndRestore(
    id: string,
  ): Promise<RepositoryResult<void>>;
  protected abstract validateAndExists(
    id: string,
  ): Promise<boolean>;
}
