import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { UnitFirestoreMapper, UnitFirestoreDoc } from './unit-firestore-mapper';
import type {
  IUnitRepository,
  IUnit,
  IUnitSummary,
  CreateUnitInput,
  UpdateUnitInput,
  UnitFilter,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';

const COLLECTION = 'units';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): UnitFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as UnitFirestoreDoc;
}

export class UnitRepository implements IUnitRepository {
  private readonly transactionManager = TransactionManager.getInstance();
  private readonly mapper = UnitFirestoreMapper;

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async createUnit(input: CreateUnitInput): Promise<RepositoryResult<IUnit>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Unit already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        academicTermId: input.academicTermId,
        gradeId: input.gradeId ?? null,
        academicYearId: input.academicYearId ?? null,
        educationalSystemId: input.educationalSystemId ?? null,
        name: input.name,
        nameAr: input.nameAr,
        description: input.description ?? null,
        order: input.order,
        isActive: input.isActive ?? true,
        isPremium: input.isPremium ?? false,
        priceCoins: input.priceCoins ?? null,
        published: input.published ?? false,
        lockedOverride: input.lockedOverride ?? null,
        createdAt: now,
        updatedAt: now,
        schemaVersion: UnitFirestoreMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateUnit(id: string, input: UpdateUnitInput, _expectedVersion: number): Promise<RepositoryResult<IUnit>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
      if (input.description !== undefined) updateData.description = input.description ?? null;
      if (input.order !== undefined) updateData.order = input.order;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.isPremium !== undefined) updateData.isPremium = input.isPremium;
      if (input.priceCoins !== undefined) updateData.priceCoins = input.priceCoins;
      if (input.gradeId !== undefined) updateData.gradeId = input.gradeId ?? null;
      if (input.academicYearId !== undefined) updateData.academicYearId = input.academicYearId ?? null;
      if (input.educationalSystemId !== undefined) updateData.educationalSystemId = input.educationalSystemId ?? null;
      if (input.published !== undefined) updateData.published = input.published;
      if (input.lockedOverride !== undefined) updateData.lockedOverride = input.lockedOverride;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getUnitById(id: string): Promise<RepositoryResult<IUnit>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listUnits(filter: UnitFilter, page: PageQuery): Promise<RepositoryResult<Page<IUnitSummary>>> {
    try {
      const query = new QueryBuilder<UnitFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.academicTermId) query.withFilter('academicTermId', 'eq', filter.academicTermId);
      if (filter.gradeId) query.withFilter('gradeId', 'eq', filter.gradeId);
      if (filter.isActive !== undefined) query.withFilter('isActive', 'eq', filter.isActive);
      if (filter.isPremium !== undefined) query.withFilter('isPremium', 'eq', filter.isPremium);
      if (filter.published !== undefined) query.withFilter('published', 'eq', filter.published);
      query.withOrderBy('order', 'asc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(JSON.parse(page.cursor)); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      query.withProjections(['academicTermId', 'gradeId', 'academicYearId', 'educationalSystemId', 'name', 'nameAr', 'order', 'isActive', 'isPremium', 'priceCoins', 'published', 'lockedOverride', 'createdAt']);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<Page<IUnitSummary>>;
      const items = result.value.items.map((d) => this.mapper.toSummary(d as unknown as UnitFirestoreDoc));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IUnitSummary>>;
    }
  }

  async getUnitsByTerm(academicTermId: string, gradeId?: string): Promise<RepositoryResult<IUnit[]>> {
    try {
      const query = new QueryBuilder<UnitFirestoreDoc>(this.transactionManager);
      query.withFilter('academicTermId', 'eq', academicTermId);
      if (gradeId) query.withFilter('gradeId', 'eq', gradeId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('order', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IUnit[]>;
      const items = result.value.items.map((d) => this.mapper.toDomain(d as unknown as UnitFirestoreDoc));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<IUnit[]>;
    }
  }

  async softDeleteUnit(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async restoreUnit(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: null, updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }
}
