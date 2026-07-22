import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { ILessonProgress, CreateLessonProgressInput, ILessonProgressStatus } from '../contracts';

export interface LessonProgressFirestoreDoc {
  id: string;
  studentId: string;
  lessonId: string;
  unitId: string;
  status: string;
  completedActivities: number;
  totalActivities: number;
  percentage: number;
  score?: number | null;
  maxScore?: number | null;
  lastActivityId?: string | null;
  startedAt?: Timestamp | string | null;
  completedAt?: Timestamp | string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Class convention matches LessonFirestoreMapper
export class LessonProgressFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: LessonProgressFirestoreDoc): ILessonProgress {
    return {
      id: doc.id,
      studentId: doc.studentId,
      lessonId: doc.lessonId,
      unitId: doc.unitId,
      status: doc.status as ILessonProgressStatus,
      completedActivities: doc.completedActivities,
      totalActivities: doc.totalActivities,
      percentage: doc.percentage,
      score: doc.score ?? undefined,
      maxScore: doc.maxScore ?? undefined,
      lastActivityId: doc.lastActivityId ?? undefined,
      startedAt: doc.startedAt ? formatFirestoreTimestamp(doc.startedAt) : undefined,
      completedAt: doc.completedAt ? formatFirestoreTimestamp(doc.completedAt) : undefined,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
    };
  }

  static toCreate(input: CreateLessonProgressInput): LessonProgressFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      studentId: input.studentId,
      lessonId: input.lessonId,
      unitId: input.unitId,
      totalActivities: input.totalActivities,
      status: 'not_started',
      completedActivities: 0,
      percentage: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
}
