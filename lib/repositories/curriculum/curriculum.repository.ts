import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { CurriculumFirestoreMapper, AcademicYearFirestoreDoc, AcademicTermFirestoreDoc } from './curriculum-firestore-mapper';
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
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
  CreateAcademicTermInput,
  UpdateAcademicTermInput,
  CurriculumFilter,
  CurriculumCollection,
} from '../contracts';
import { EDUCATIONAL_SYSTEMS } from '../../domain/curriculum/constants/educational-systems';
import { STAGES } from '../../domain/curriculum/constants/stages';
import { GRADES } from '../../domain/curriculum/constants/grades';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';

const COLLECTION_ACADEMIC_YEARS = 'academicYears';
const COLLECTION_ACADEMIC_TERMS = 'academicTerms';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): Record<string, unknown> | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as Record<string, unknown>;
}

export class CurriculumRepository implements ICurriculumRepository {
  private readonly transactionManager = TransactionManager.getInstance();
  private readonly mapper = CurriculumFirestoreMapper;

  private getDb() {
    return getFirestoreInstance();
  }

  // ========== Educational System (Static) ==========

  async getEducationalSystemById(id: string): Promise<RepositoryResult<IEducationalSystem>> {
    const system = EDUCATIONAL_SYSTEMS.find((s) => s.id === id);
    if (!system) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Educational system not found: ${id}`, retryable: false, requestId: '' } };
    }
    return { ok: true, value: system };
  }

  async listEducationalSystems(_filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IEducationalSystemSummary>>> {
    const items = EDUCATIONAL_SYSTEMS
      .filter((s) => s.isActive)
      .slice(0, page.limit)
      .map((s): IEducationalSystemSummary => ({
        id: s.id,
        name: s.name,
        nameAr: s.nameAr,
        isActive: s.isActive,
        createdAt: s.createdAt,
      }));
    return { ok: true, value: { items, nextCursor: null } };
  }

  // ========== Stage (Static) ==========

  async getStageById(id: string): Promise<RepositoryResult<IStage>> {
    const stage = STAGES.find((s) => s.id === id);
    if (!stage) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Stage not found: ${id}`, retryable: false, requestId: '' } };
    }
    return { ok: true, value: stage };
  }

  async listStages(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IStageSummary>>> {
    let filtered = [...STAGES];
    if (filter.educationalSystemId) {
      filtered = filtered.filter((s) => s.educationalSystemId === filter.educationalSystemId);
    }
    if (filter.isActive !== undefined) {
      filtered = filtered.filter((s) => s.isActive === filter.isActive);
    }
    const items = filtered
      .sort((a, b) => a.order - b.order)
      .slice(0, page.limit)
      .map((s): IStageSummary => ({
        id: s.id,
        educationalSystemId: s.educationalSystemId,
        name: s.name,
        nameAr: s.nameAr,
        order: s.order,
        isActive: s.isActive,
        createdAt: s.createdAt,
      }));
    return { ok: true, value: { items, nextCursor: null } };
  }

  async getStagesBySystem(systemId: string): Promise<RepositoryResult<IStage[]>> {
    const items = STAGES
      .filter((s) => s.educationalSystemId === systemId && s.isActive)
      .sort((a, b) => a.order - b.order);
    return { ok: true, value: items };
  }

  // ========== Grade (Static) ==========

  async getGradeById(id: string): Promise<RepositoryResult<IGrade>> {
    const grade = GRADES.find((g) => g.id === id);
    if (!grade) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Grade not found: ${id}`, retryable: false, requestId: '' } };
    }
    return { ok: true, value: grade };
  }

  async listGrades(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IGradeSummary>>> {
    let filtered = [...GRADES];
    if (filter.stageId) {
      filtered = filtered.filter((g) => g.stageId === filter.stageId);
    }
    if (filter.educationalSystemId) {
      filtered = filtered.filter((g) => g.educationalSystemId === filter.educationalSystemId);
    }
    if (filter.isActive !== undefined) {
      filtered = filtered.filter((g) => g.isActive === filter.isActive);
    }
    const items = filtered
      .sort((a, b) => a.order - b.order)
      .slice(0, page.limit)
      .map((g): IGradeSummary => ({
        id: g.id,
        educationalSystemId: g.educationalSystemId,
        stageId: g.stageId,
        name: g.name,
        nameAr: g.nameAr,
        order: g.order,
        isActive: g.isActive,
        createdAt: g.createdAt,
      }));
    return { ok: true, value: { items, nextCursor: null } };
  }

  async getGradesByStage(stageId: string): Promise<RepositoryResult<IGrade[]>> {
    const items = GRADES
      .filter((g) => g.stageId === stageId && g.isActive)
      .sort((a, b) => a.order - b.order);
    return { ok: true, value: items };
  }

  // ========== Academic Year (Dynamic) ==========

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
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicYearToDomain(doc as unknown as AcademicYearFirestoreDoc) };
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
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicYearToDomain(doc as unknown as AcademicYearFirestoreDoc) };
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
      const doc = formatDoc(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found: ${id}`, retryable: false, requestId: '' } };
      const firestoreDoc = doc as unknown as AcademicYearFirestoreDoc;
      if (firestoreDoc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic year not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicYearToDomain(firestoreDoc) };
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

  // ========== Academic Term (Dynamic) ==========

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
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicTermToDomain(doc as unknown as AcademicTermFirestoreDoc) };
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
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicTermToDomain(doc as unknown as AcademicTermFirestoreDoc) };
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
      const doc = formatDoc(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found: ${id}`, retryable: false, requestId: '' } };
      const firestoreDoc = doc as unknown as AcademicTermFirestoreDoc;
      if (firestoreDoc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Academic term not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.academicTermToDomain(firestoreDoc) };
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

  async getCurrentAcademicContext(userId?: string): Promise<RepositoryResult<ICurrentAcademicContext>> {
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

      let educationalSystem: IEducationalSystem | null = null;
      let stage: IStage | null = null;
      let grade: IGrade | null = null;

      if (userId) {
        try {
          const db = this.getDb();
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data() as Record<string, string | undefined>;
            const esId = userData.educationalSystemId;
            const stageId = userData.stageId;
            const gradeId = userData.gradeId;
            if (esId) {
              educationalSystem = EDUCATIONAL_SYSTEMS.find((s) => s.id === esId) ?? null;
            }
            if (stageId) {
              stage = STAGES.find((s) => s.id === stageId) ?? null;
            }
            if (gradeId) {
              grade = GRADES.find((g) => g.id === gradeId) ?? null;
            }
          }
        } catch {
          // User lookup failed, return context without user-specific data
        }
      }

      const context: ICurrentAcademicContext = {
        educationalSystem,
        stage,
        grade,
        academicYear: currentYearResult.value,
        academicTerm,
      };
      return { ok: true, value: context };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  // ========== Soft Delete / Restore (Academic Years & Terms only) ==========

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
