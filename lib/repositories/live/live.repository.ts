import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import type {
  ILiveRepository,
  ILiveSession,
  ILiveBooking,
  ILiveAttendance,
  ITeacherAvailability,
  ITeacherDateBlock,
  ILiveAnnouncement,
  ILiveSessionFilter,
  ILiveBookingFilter,
} from '../contracts';
const COLL_SESSIONS = 'liveSessions';
const COLL_BOOKINGS = 'liveBookings';
const COLL_AVAILABILITY = 'teacherAvailability';
const COLL_DATE_BLOCKS = 'teacherDateBlocks';
const COLL_ATTENDANCE = 'liveAttendance';
const COLL_ANNOUNCEMENTS = 'liveAnnouncements';

function formatDoc<T>(snap: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as unknown as T;
}

export class LiveRepository implements ILiveRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  // ===== Sessions =====

  async createSession(input: Partial<ILiveSession>): Promise<RepositoryResult<ILiveSession>> {
    try {
      if (!input.id) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Session ID is required', retryable: false, requestId: '' },
        };
      }
      const db = this.getDb();
      const docRef = db.collection(COLL_SESSIONS).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return {
          ok: false,
          error: { code: 'ALREADY_EXISTS', message: `Session already exists: ${input.id}`, retryable: false, requestId: '' },
        };
      }
      const now = Timestamp.now();
      await docRef.set({
        ...input,
        durationMinutes: input.durationMinutes ?? 0,
        maxStudents: input.maxStudents ?? null,
        availableSeats: input.availableSeats ?? null,
        meetingUrl: input.meetingUrl ?? null,
        meetingPassword: input.meetingPassword ?? null,
        meetingProvider: input.meetingProvider ?? 'EXTERNAL_URL',
        notes: input.notes ?? null,
        publishedAt: input.publishedAt ?? null,
        scheduledAt: input.scheduledAt ?? null,
        openedAt: input.openedAt ?? null,
        liveAt: input.liveAt ?? null,
        completedAt: input.completedAt ?? null,
        cancelledAt: input.cancelledAt ?? null,
        cancelReason: input.cancelReason ?? null,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
        deletedAt: null,
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ILiveSession>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read created session', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getSessionById(id: string): Promise<RepositoryResult<ILiveSession | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLL_SESSIONS).doc(id).get();
      if (!snap.exists) {
        return { ok: true, value: null };
      }
      const doc = formatDoc<ILiveSession>(snap);
      return { ok: true, value: doc ?? null };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateSession(id: string, input: Partial<ILiveSession>): Promise<RepositoryResult<ILiveSession>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLL_SESSIONS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Session not found: ${id}`, retryable: false, requestId: '' },
        };
      }
      await docRef.update({
        ...input,
        updatedAt: Timestamp.now(),
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ILiveSession>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read updated session', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listSessions(filter: ILiveSessionFilter): Promise<RepositoryResult<ILiveSession[]>> {
    try {
      const query = new QueryBuilder<ILiveSession>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.teacherId) query.withFilter('teacherId', 'eq', filter.teacherId);
      if (filter.gradeId) query.withFilter('gradeId', 'eq', filter.gradeId);
      if (filter.status) query.withFilter('status', 'eq', filter.status);
      if (filter.dateFrom) query.withFilter('date', 'gte', filter.dateFrom);
      if (filter.dateTo) query.withFilter('date', 'lte', filter.dateTo);
      query.withOrderBy('date', 'desc');
      const result = await query.execute(COLL_SESSIONS);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items as unknown as ILiveSession[] };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async deleteSession(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLL_SESSIONS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Session not found: ${id}`, retryable: false, requestId: '' },
        };
      }
      await docRef.update({
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  // ===== Bookings =====

  async createBooking(input: ILiveBooking): Promise<RepositoryResult<ILiveBooking>> {
    try {
      if (!input.id) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Booking ID is required', retryable: false, requestId: '' },
        };
      }
      const db = this.getDb();
      const docRef = db.collection(COLL_BOOKINGS).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return {
          ok: false,
          error: { code: 'ALREADY_EXISTS', message: `Booking already exists: ${input.id}`, retryable: false, requestId: '' },
        };
      }
      const now = Timestamp.now();
      await docRef.set({
        ...input,
        cancelledAt: input.cancelledAt ?? null,
        cancelReason: input.cancelReason ?? null,
        createdAt: now,
        updatedAt: now,
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ILiveBooking>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read created booking', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getBookingById(id: string): Promise<RepositoryResult<ILiveBooking | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLL_BOOKINGS).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      const doc = formatDoc<ILiveBooking>(snap);
      return { ok: true, value: doc ?? null };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listBookings(filter: ILiveBookingFilter): Promise<RepositoryResult<ILiveBooking[]>> {
    try {
      const query = new QueryBuilder<ILiveBooking>(this.transactionManager);
      if (filter.studentId) query.withFilter('studentId', 'eq', filter.studentId);
      if (filter.sessionId) query.withFilter('sessionId', 'eq', filter.sessionId);
      if (filter.status) query.withFilter('status', 'eq', filter.status);
      query.withOrderBy('createdAt', 'desc');
      const result = await query.execute(COLL_BOOKINGS);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items as unknown as ILiveBooking[] };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async cancelBooking(id: string, reason?: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLL_BOOKINGS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Booking not found: ${id}`, retryable: false, requestId: '' },
        };
      }
      await docRef.update({
        status: 'CANCELLED',
        cancelledAt: Timestamp.now(),
        cancelReason: reason ?? null,
        updatedAt: Timestamp.now(),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getBookingsBySession(sessionId: string): Promise<RepositoryResult<ILiveBooking[]>> {
    try {
      const query = new QueryBuilder<ILiveBooking>(this.transactionManager);
      query.withFilter('sessionId', 'eq', sessionId);
      query.withOrderBy('createdAt', 'asc');
      const result = await query.execute(COLL_BOOKINGS);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items as unknown as ILiveBooking[] };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  // ===== Availability =====

  async getTeacherAvailability(teacherId: string): Promise<RepositoryResult<ITeacherAvailability[]>> {
    try {
      const query = new QueryBuilder<ITeacherAvailability>(this.transactionManager);
      query.withFilter('teacherId', 'eq', teacherId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('dayOfWeek', 'asc');
      const result = await query.execute(COLL_AVAILABILITY);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items as unknown as ITeacherAvailability[] };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async createAvailability(input: ITeacherAvailability): Promise<RepositoryResult<ITeacherAvailability>> {
    try {
      if (!input.id) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Availability ID is required', retryable: false, requestId: '' },
        };
      }
      const db = this.getDb();
      const docRef = db.collection(COLL_AVAILABILITY).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return {
          ok: false,
          error: { code: 'ALREADY_EXISTS', message: `Availability already exists: ${input.id}`, retryable: false, requestId: '' },
        };
      }
      const now = Timestamp.now();
      await docRef.set({
        ...input,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ITeacherAvailability>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read created availability', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateAvailability(id: string, input: Partial<ITeacherAvailability>): Promise<RepositoryResult<ITeacherAvailability>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLL_AVAILABILITY).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Availability not found: ${id}`, retryable: false, requestId: '' },
        };
      }
      await docRef.update({
        ...input,
        updatedAt: Timestamp.now(),
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ITeacherAvailability>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read updated availability', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async deleteAvailability(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLL_AVAILABILITY).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Availability not found: ${id}`, retryable: false, requestId: '' },
        };
      }
      await docRef.update({
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  // ===== Date Blocks =====

  async listDateBlocks(teacherId: string): Promise<RepositoryResult<ITeacherDateBlock[]>> {
    try {
      const query = new QueryBuilder<ITeacherDateBlock>(this.transactionManager);
      query.withFilter('teacherId', 'eq', teacherId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('blockedDate', 'asc');
      const result = await query.execute(COLL_DATE_BLOCKS);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items as unknown as ITeacherDateBlock[] };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async createDateBlock(input: ITeacherDateBlock): Promise<RepositoryResult<ITeacherDateBlock>> {
    try {
      if (!input.id) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Date block ID is required', retryable: false, requestId: '' },
        };
      }
      const db = this.getDb();
      const docRef = db.collection(COLL_DATE_BLOCKS).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return {
          ok: false,
          error: { code: 'ALREADY_EXISTS', message: `Date block already exists: ${input.id}`, retryable: false, requestId: '' },
        };
      }
      const now = Timestamp.now();
      await docRef.set({
        ...input,
        createdAt: now,
        deletedAt: null,
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ITeacherDateBlock>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read created date block', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async deleteDateBlock(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLL_DATE_BLOCKS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Date block not found: ${id}`, retryable: false, requestId: '' },
        };
      }
      await docRef.update({
        deletedAt: Timestamp.now(),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  // ===== Attendance =====

  async listAttendance(sessionId: string): Promise<RepositoryResult<ILiveAttendance[]>> {
    try {
      const query = new QueryBuilder<ILiveAttendance>(this.transactionManager);
      query.withFilter('sessionId', 'eq', sessionId);
      query.withOrderBy('createdAt', 'asc');
      const result = await query.execute(COLL_ATTENDANCE);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items as unknown as ILiveAttendance[] };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async recordAttendance(input: ILiveAttendance): Promise<RepositoryResult<ILiveAttendance>> {
    try {
      if (!input.id) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Attendance record ID is required', retryable: false, requestId: '' },
        };
      }
      const db = this.getDb();
      const docRef = db.collection(COLL_ATTENDANCE).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return {
          ok: false,
          error: { code: 'ALREADY_EXISTS', message: `Attendance record already exists: ${input.id}`, retryable: false, requestId: '' },
        };
      }
      const now = Timestamp.now();
      await docRef.set({
        ...input,
        joinedAt: input.joinedAt ?? null,
        leftAt: input.leftAt ?? null,
        durationMinutes: input.durationMinutes ?? null,
        markedById: input.markedById ?? null,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ILiveAttendance>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read created attendance', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  // ===== Announcements =====

  async listAnnouncements(sessionId: string): Promise<RepositoryResult<ILiveAnnouncement[]>> {
    try {
      const query = new QueryBuilder<ILiveAnnouncement>(this.transactionManager);
      query.withFilter('sessionId', 'eq', sessionId);
      query.withOrderBy('createdAt', 'desc');
      const result = await query.execute(COLL_ANNOUNCEMENTS);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value.items as unknown as ILiveAnnouncement[] };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async createAnnouncement(input: ILiveAnnouncement): Promise<RepositoryResult<ILiveAnnouncement>> {
    try {
      if (!input.id) {
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: 'Announcement ID is required', retryable: false, requestId: '' },
        };
      }
      const db = this.getDb();
      const docRef = db.collection(COLL_ANNOUNCEMENTS).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return {
          ok: false,
          error: { code: 'ALREADY_EXISTS', message: `Announcement already exists: ${input.id}`, retryable: false, requestId: '' },
        };
      }
      const now = Timestamp.now();
      await docRef.set({
        ...input,
        createdAt: now,
        updatedAt: now,
      } as Record<string, unknown>);
      const saved = await docRef.get();
      const doc = formatDoc<ILiveAnnouncement>(saved);
      if (!doc) {
        return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read created announcement', retryable: false, requestId: '' } };
      }
      return { ok: true, value: doc };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }
}
