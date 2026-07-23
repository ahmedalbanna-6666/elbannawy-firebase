import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { CurriculumFirestoreMapper } from './curriculum-firestore-mapper';
import {
  EducationalSystemFirestoreDoc,
  StageFirestoreDoc,
  GradeFirestoreDoc,
  AcademicYearFirestoreDoc,
  AcademicTermFirestoreDoc,
} from './curriculum-firestore-mapper';
import type {
  ICurriculumRepository,
  IEducationalSystem,
  IStage,
  IGrade,
  IAcademicYear,
  IAcademicTerm,
  IEducationalSystemSummary,
  IStageSummary,
  IGradeSummary,
  IAcademicYearSummary,
  IAcademicTermSummary,
  ICurrentAcademicContext,
  CreateEducationalSystemInput,
  UpdateEducationalSystemInput,
  CreateStageInput,
  UpdateStageInput,
  CreateGradeInput,
  UpdateGradeInput,
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
  CreateAcademicTermInput,
  UpdateAcademicTermInput,
  CurriculumFilter,
  CurriculumCollection,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { toRepositoryError } from '../firestore/firestore.service';

const COLLECTION_EDUCATIONAL_SYSTEMS = 'educationalSystems';
const COLLECTION_STAGES = 'stages';
const COLLECTION_GRADES = 'grades';
const COLLECTION_ACADEMIC_YEARS = 'academicYears';
const COLLECTION_ACADEMIC_TERMS = 'academicTerms';

function formatDoc<T>(snap: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as unknown as T;
}

export class CurriculumRepository implements ICurriculumRepository {
  private readonly transactionManager = TransactionManager.getInstance();
  private readonly mapper = CurriculumFirestoreMapper;

  private getDb() {
    return getFirestoreInstance();
  }

  // ========== Educational System ==========

  async createEducationalSystem(input: CreateEducationalSystemInput): Promise<RepositoryResult<IEducationalSystem>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_EDUCATIONAL_SYSTEMS).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Educational system already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        name: input.name,
        nameAr: input.nameAr,
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CurriculumFirestoreMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc<EducationalSystemFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.educationalSystemToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateEducationalSystem(id: string, input: UpdateEducationalSystemInput, _expectedVersion: number): Promise<RepositoryResult<IEducationalSystem>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_EDUCATIONAL_SYSTEMS).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Educational system not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
      if (input.description !== undefined) updateData.description = input.description ?? null;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const doc = formatDoc<EducationalSystemFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Educational system not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.educationalSystemToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getEducationalSystemById(id: string): Promise<RepositoryResult<IEducationalSystem>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_EDUCATIONAL_SYSTEMS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Educational system not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc<EducationalSystemFirestoreDoc>(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Educational system not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Educational system not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.educationalSystemToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listEducationalSystems(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IEducationalSystemSummary>>> {
    try {
      const query = new QueryBuilder<EducationalSystemFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.isActive !== undefined) query.withFilter('isActive', 'eq', filter.isActive);
      query.withOrderBy('name', 'asc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(JSON.parse(page.cursor)); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      const result = await query.execute(COLLECTION_EDUCATIONAL_SYSTEMS);
      if (!result.ok) return result as unknown as RepositoryResult<Page<IEducationalSystemSummary>>;
      const items = result.value.items.map((d) => this.mapper.educationalSystemToSummary(d as unknown as EducationalSystemFirestoreDoc));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IEducationalSystemSummary>>;
    }
  }

  // ========== Stage ==========

  async createStage(input: CreateStageInput): Promise<RepositoryResult<IStage>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_STAGES).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Stage already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        educationalSystemId: input.educationalSystemId,
        name: input.name,
        nameAr: input.nameAr,
        order: input.order,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CurriculumFirestoreMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc<StageFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.stageToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateStage(id: string, input: UpdateStageInput, _expectedVersion: number): Promise<RepositoryResult<IStage>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_STAGES).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Stage not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
      if (input.order !== undefined) updateData.order = input.order;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const doc = formatDoc<StageFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Stage not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.stageToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getStageById(id: string): Promise<RepositoryResult<IStage>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_STAGES).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Stage not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc<StageFirestoreDoc>(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Stage not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Stage not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.stageToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listStages(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IStageSummary>>> {
    try {
      const query = new QueryBuilder<StageFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.educationalSystemId) query.withFilter('educationalSystemId', 'eq', filter.educationalSystemId);
      if (filter.isActive !== undefined) query.withFilter('isActive', 'eq', filter.isActive);
      query.withOrderBy('order', 'asc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(JSON.parse(page.cursor)); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      const result = await query.execute(COLLECTION_STAGES);
      if (!result.ok) return result as unknown as RepositoryResult<Page<IStageSummary>>;
      const items = result.value.items.map((d) => this.mapper.stageToSummary(d as unknown as StageFirestoreDoc));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IStageSummary>>;
    }
  }

  async getStagesBySystem(systemId: string): Promise<RepositoryResult<IStage[]>> {
    try {
      const query = new QueryBuilder<StageFirestoreDoc>(this.transactionManager);
      query.withFilter('educationalSystemId', 'eq', systemId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('order', 'asc');
      const result = await query.execute(COLLECTION_STAGES);
      if (!result.ok) return result as unknown as RepositoryResult<IStage[]>;
      const items = result.value.items.map((d) => this.mapper.stageToDomain(d as unknown as StageFirestoreDoc));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<IStage[]>;
    }
  }

  // ========== Grade ==========

  async createGrade(input: CreateGradeInput): Promise<RepositoryResult<IGrade>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_GRADES).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Grade already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        educationalSystemId: input.educationalSystemId,
        stageId: input.stageId,
        name: input.name,
        nameAr: input.nameAr,
        order: input.order,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CurriculumFirestoreMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc<GradeFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.gradeToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateGrade(id: string, input: UpdateGradeInput, _expectedVersion: number): Promise<RepositoryResult<IGrade>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_GRADES).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Grade not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
      if (input.order !== undefined) updateData.order = input.order;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const doc = formatDoc<GradeFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Grade not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.gradeToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getGradeById(id: string): Promise<RepositoryResult<IGrade>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_GRADES).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Grade not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc<GradeFirestoreDoc>(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Grade not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Grade not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.gradeToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listGrades(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IGradeSummary>>> {
    try {
      const query = new QueryBuilder<GradeFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.stageId) query.withFilter('stageId', 'eq', filter.stageId);
      if (filter.educationalSystemId) query.withFilter('educationalSystemId', 'eq', filter.educationalSystemId);
      if (filter.isActive !== undefined) query.withFilter('isActive', 'eq', filter.isActive);
      query.withOrderBy('order', 'asc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(JSON.parse(page.cursor)); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      const result = await query.execute(COLLECTION_GRADES);
      if (!result.ok) return result as unknown as RepositoryResult<Page<IGradeSummary>>;
      const items = result.value.items.map((d) => this.mapper.gradeToSummary(d as unknown as GradeFirestoreDoc));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IGradeSummary>>;
    }
  }

  async getGradesByStage(stageId: string): Promise<RepositoryResult<IGrade[]>> {
    try {
      const query = new QueryBuilder<GradeFirestoreDoc>(this.transactionManager);
      query.withFilter('stageId', 'eq', stageId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('order', 'asc');
      const result = await query.execute(COLLECTION_GRADES);
      if (!result.ok) return result as unknown as RepositoryResult<IGrade[]>;
      const items = result.value.items.map((d) => this.mapper.gradeToDomain(d as unknown as GradeFirestoreDoc));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<IGrade[]>;
    }
  }

  // ========== Academic Year ==========

  async createAcademicYear(input: CreateAcademicYearInput): Promise<RepositoryResult<IAcademicYear>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_ACADEMIC_YEARS).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Academic year already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        educationalSystemId: input.educationalSystemId,
        name: input.name,
        nameAr: input.nameAr,
        startDate: input.startDate,
        endDate: input.endDate,
        isCurrent: input.isCurrent ?? false,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CurriculumFirestoreMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc<AcademicYearFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicYearToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateAcademicYear(id: string, input: UpdateAcademicYearInput, _expectedVersion: number): Promise<RepositoryResult<IAcademicYear>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_ACADEMIC_YEARS).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
      if (input.startDate !== undefined) updateData.startDate = input.startDate;
      if (input.endDate !== undefined) updateData.endDate = input.endDate;
      if (input.isCurrent !== undefined) updateData.isCurrent = input.isCurrent;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const doc = formatDoc<AcademicYearFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicYearToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getAcademicYearById(id: string): Promise<RepositoryResult<IAcademicYear>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_ACADEMIC_YEARS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc<AcademicYearFirestoreDoc>(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicYearToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listAcademicYears(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IAcademicYearSummary>>> {
    try {
      const query = new QueryBuilder<AcademicYearFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.educationalSystemId) query.withFilter('educationalSystemId', 'eq', filter.educationalSystemId);
      if (filter.isCurrent !== undefined) query.withFilter('isCurrent', 'eq', filter.isCurrent);
      if (filter.isActive !== undefined) query.withFilter('isActive', 'eq', filter.isActive);
      query.withOrderBy('startDate', 'desc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(JSON.parse(page.cursor)); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      const result = await query.execute(COLLECTION_ACADEMIC_YEARS);
      if (!result.ok) return result as unknown as RepositoryResult<Page<IAcademicYearSummary>>;
      const items = result.value.items.map((d) => this.mapper.academicYearToSummary(d as unknown as AcademicYearFirestoreDoc));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IAcademicYearSummary>>;
    }
  }

  // ========== Academic Term ==========

  async createAcademicTerm(input: CreateAcademicTermInput): Promise<RepositoryResult<IAcademicTerm>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_ACADEMIC_TERMS).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Academic term already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        academicYearId: input.academicYearId,
        name: input.name,
        nameAr: input.nameAr,
        order: input.order,
        startDate: input.startDate,
        endDate: input.endDate,
        isCurrent: input.isCurrent ?? false,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CurriculumFirestoreMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc<AcademicTermFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicTermToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateAcademicTerm(id: string, input: UpdateAcademicTermInput, _expectedVersion: number): Promise<RepositoryResult<IAcademicTerm>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_ACADEMIC_TERMS).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
      if (input.order !== undefined) updateData.order = input.order;
      if (input.startDate !== undefined) updateData.startDate = input.startDate;
      if (input.endDate !== undefined) updateData.endDate = input.endDate;
      if (input.isCurrent !== undefined) updateData.isCurrent = input.isCurrent;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const doc = formatDoc<AcademicTermFirestoreDoc>(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicTermToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getAcademicTermById(id: string): Promise<RepositoryResult<IAcademicTerm>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION_ACADEMIC_TERMS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc<AcademicTermFirestoreDoc>(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicTermToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listAcademicTerms(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IAcademicTermSummary>>> {
    try {
      const query = new QueryBuilder<AcademicTermFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.academicYearId) query.withFilter('academicYearId', 'eq', filter.academicYearId);
      if (filter.isCurrent !== undefined) query.withFilter('isCurrent', 'eq', filter.isCurrent);
      if (filter.isActive !== undefined) query.withFilter('isActive', 'eq', filter.isActive);
      query.withOrderBy('order', 'asc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(JSON.parse(page.cursor)); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      const result = await query.execute(COLLECTION_ACADEMIC_TERMS);
      if (!result.ok) return result as unknown as RepositoryResult<Page<IAcademicTermSummary>>;
      const items = result.value.items.map((d) => this.mapper.academicTermToSummary(d as unknown as AcademicTermFirestoreDoc));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IAcademicTermSummary>>;
    }
  }

  async getTermsByAcademicYear(academicYearId: string): Promise<RepositoryResult<IAcademicTerm[]>> {
    try {
      const query = new QueryBuilder<AcademicTermFirestoreDoc>(this.transactionManager);
      query.withFilter('academicYearId', 'eq', academicYearId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('order', 'asc');
      const result = await query.execute(COLLECTION_ACADEMIC_TERMS);
      if (!result.ok) return result as unknown as RepositoryResult<IAcademicTerm[]>;
      const items = result.value.items.map((d) => this.mapper.academicTermToDomain(d as unknown as AcademicTermFirestoreDoc));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<IAcademicTerm[]>;
    }
  }

  // ========== Current Context ==========

  async getCurrentAcademicYear(): Promise<RepositoryResult<IAcademicYear | null>> {
    try {
      const result = await this.listAcademicYears({ isCurrent: true, isActive: true, educationalSystemId: undefined }, { limit: 1 });
      if (!result.ok) return result as unknown as RepositoryResult<IAcademicYear | null>;
      const year = result.value.items[0];
      if (!year) return { ok: true, value: null };
      return this.getAcademicYearById(year.id) as unknown as RepositoryResult<IAcademicYear | null>;
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getCurrentAcademicTerm(academicYearId: string): Promise<RepositoryResult<IAcademicTerm | null>> {
    try {
      const result = await this.listAcademicTerms({ academicYearId, isCurrent: true, isActive: true }, { limit: 1 });
      if (!result.ok) return result as unknown as RepositoryResult<IAcademicTerm | null>;
      const term = result.value.items[0];
      if (!term) return { ok: true, value: null };
      return this.getAcademicTermById(term.id) as unknown as RepositoryResult<IAcademicTerm | null>;
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getCurrentAcademicContext(): Promise<RepositoryResult<ICurrentAcademicContext>> {
    try {
      const currentYearResult = await this.getCurrentAcademicYear();
      if (!currentYearResult.ok) return currentYearResult as unknown as RepositoryResult<ICurrentAcademicContext>;

      let academicTerm: IAcademicTerm | null = null;
      if (currentYearResult.value) {
        const currentTermResult = await this.getCurrentAcademicTerm(currentYearResult.value.id);
        if (currentTermResult.ok) {
          academicTerm = currentTermResult.value;
        }
      }

      const context: ICurrentAcademicContext = {
        educationalSystem: null,
        stage: null,
        grade: null,
        academicYear: currentYearResult.value,
        academicTerm,
      };
      return { ok: true, value: context };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  // ========== Soft Delete / Restore ==========

  async softDeleteCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(collection).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Document not found in ${collection}: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async restoreCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(collection).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Document not found in ${collection}: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: null, updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }
}
