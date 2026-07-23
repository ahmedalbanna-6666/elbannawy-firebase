import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { TeacherAssignmentMapper, TeacherAssignmentFirestoreDoc, teacherAssignmentToDomain } from './teacher-firestore-mapper';
import type {
  ITutorRepository,
  TeacherAssignment,
  CreateTeacherAssignmentInput,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import type { ICursor } from '../../shared/types/cursor.types';

const COLLECTION = 'teacherAssignments';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): TeacherAssignmentFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as TeacherAssignmentFirestoreDoc;
}

function parseCursor(raw: string): ICursor {
  return JSON.parse(raw) as ICursor;
}

export class TeacherRepository implements ITutorRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async createAssignment(input: CreateTeacherAssignmentInput): Promise<RepositoryResult<TeacherAssignment>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Assignment already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        teacherId: input.teacherId,
        gradeId: input.gradeId,
        academicYearId: input.academicYearId,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        schemaVersion: TeacherAssignmentMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: teacherAssignmentToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getAssignmentById(assignmentId: string): Promise<RepositoryResult<TeacherAssignment>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).doc(assignmentId).get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Assignment not found: ${assignmentId}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc(snap);
      if (!doc || doc.deletedAt) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Assignment not found: ${assignmentId}`, retryable: false, requestId: '' } };
      }
      return { ok: true, value: teacherAssignmentToDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listTeacherAssignments(teacherId: string, page: PageQuery): Promise<RepositoryResult<Page<TeacherAssignment>>> {
    try {
      const query = new QueryBuilder<TeacherAssignmentFirestoreDoc>(this.transactionManager);
      query.withFilter('teacherId', 'eq', teacherId);
      query.withFilter('deletedAt', 'eq', null);
      query.withFilter('status', 'eq', 'active');
      query.withOrderBy('createdAt', 'desc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(parseCursor(page.cursor)); } catch {
          return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } };
        }
      }
      const result = await query.execute(COLLECTION);
      if (!result.ok) return { ok: false, error: result.error };
      const items = result.value.items.map((d) => teacherAssignmentToDomain(d));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listGradeTeachers(gradeId: string, page: PageQuery): Promise<RepositoryResult<Page<TeacherAssignment>>> {
    try {
      const query = new QueryBuilder<TeacherAssignmentFirestoreDoc>(this.transactionManager);
      query.withFilter('gradeId', 'eq', gradeId);
      query.withFilter('deletedAt', 'eq', null);
      query.withFilter('status', 'eq', 'active');
      query.withOrderBy('createdAt', 'desc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { query.withCursor(parseCursor(page.cursor)); } catch {
          return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } };
        }
      }
      const result = await query.execute(COLLECTION);
      if (!result.ok) return { ok: false, error: result.error };
      const items = result.value.items.map((d) => teacherAssignmentToDomain(d));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async hasGradeScope(teacherId: string, gradeId: string): Promise<RepositoryResult<boolean>> {
    try {
      const query = new QueryBuilder<TeacherAssignmentFirestoreDoc>(this.transactionManager);
      query.withFilter('teacherId', 'eq', teacherId);
      query.withFilter('gradeId', 'eq', gradeId);
      query.withFilter('deletedAt', 'eq', null);
      query.withFilter('status', 'eq', 'active');
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items.length > 0 };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async deactivateAssignment(assignmentId: string, requestId: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(assignmentId);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Assignment not found: ${assignmentId}`, retryable: false, requestId } };
      }
      await docRef.update({
        status: 'inactive',
        updatedAt: Timestamp.now(),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }
}
