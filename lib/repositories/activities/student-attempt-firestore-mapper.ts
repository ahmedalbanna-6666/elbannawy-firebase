import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { IStudentAttempt, IStudentAttemptSummary, CreateAttemptInput, IAttemptStatus, IGradingMethod } from '../contracts';

export interface StudentAttemptFirestoreDoc {
  id: string;
  activityId: string;
  studentId: string;
  lessonId: string;
  unitId: string;
  attemptNumber: number;
  answer?: unknown;
  score?: number | null;
  maxScore: number;
  percentage?: number | null;
  passed?: boolean | null;
  feedback?: string | null;
  correctAnswer?: unknown;
  startedAt: Timestamp | string;
  submittedAt?: Timestamp | string | null;
  timeLimit?: number | null;
  timeSpent?: number | null;
  status: string;
  gradingMethod: string;
  state?: unknown;
  activitySchemaVersion: number;
  metadata: {
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceType?: string | null;
    submittedFrom?: string | null;
  };
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Class convention matches LessonFirestoreMapper
export class StudentAttemptFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: StudentAttemptFirestoreDoc): IStudentAttempt {
    return {
      id: doc.id,
      activityId: doc.activityId,
      studentId: doc.studentId,
      lessonId: doc.lessonId,
      unitId: doc.unitId,
      attemptNumber: doc.attemptNumber,
      answer: doc.answer,
      score: doc.score ?? undefined,
      maxScore: doc.maxScore,
      percentage: doc.percentage ?? undefined,
      passed: doc.passed ?? undefined,
      feedback: doc.feedback ?? undefined,
      correctAnswer: doc.correctAnswer,
      startedAt: formatFirestoreTimestamp(doc.startedAt),
      submittedAt: doc.submittedAt ? formatFirestoreTimestamp(doc.submittedAt) : undefined,
      timeLimit: doc.timeLimit ?? undefined,
      timeSpent: doc.timeSpent ?? undefined,
      status: doc.status as IAttemptStatus,
      gradingMethod: doc.gradingMethod as IGradingMethod,
      state: doc.state,
      activitySchemaVersion: doc.activitySchemaVersion,
      metadata: {
        ipAddress: doc.metadata.ipAddress ?? undefined,
        userAgent: doc.metadata.userAgent ?? undefined,
        deviceType: doc.metadata.deviceType ?? undefined,
        submittedFrom: doc.metadata.submittedFrom ?? undefined,
      },
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
    };
  }

  static toSummary(doc: StudentAttemptFirestoreDoc): IStudentAttemptSummary {
    return {
      id: doc.id,
      activityId: doc.activityId,
      studentId: doc.studentId,
      attemptNumber: doc.attemptNumber,
      score: doc.score ?? undefined,
      maxScore: doc.maxScore,
      percentage: doc.percentage ?? undefined,
      passed: doc.passed ?? undefined,
      status: doc.status as IAttemptStatus,
      gradingMethod: doc.gradingMethod as IGradingMethod,
      submittedAt: doc.submittedAt ? formatFirestoreTimestamp(doc.submittedAt) : undefined,
      timeSpent: doc.timeSpent ?? undefined,
    };
  }

  static toCreate(input: CreateAttemptInput): StudentAttemptFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      activityId: input.activityId,
      studentId: input.studentId,
      lessonId: input.lessonId,
      unitId: input.unitId,
      attemptNumber: input.attemptNumber,
      maxScore: input.maxScore,
      gradingMethod: input.gradingMethod,
      timeLimit: input.timeLimit ?? null,
      activitySchemaVersion: input.activitySchemaVersion,
      state: input.state ?? null,
      status: 'in_progress',
      startedAt: now,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
  }
}
