import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { IHomeworkAttempt, IHomeworkAttemptStatus } from '../contracts';

export interface HomeworkAttemptFirestoreDoc {
  id: string;
  studentId: string;
  homeworkId: string;
  attemptNumber: number;
  status: string;
  score?: number | null;
  passed?: boolean | null;
  startedAt: Timestamp | string;
  submittedAt?: Timestamp | string | null;
  gradedAt?: Timestamp | string | null;
  timeSpentSeconds?: number | null;
  contentVersion: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export class HomeworkAttemptFirestoreMapper {
  static toDomain(doc: HomeworkAttemptFirestoreDoc): IHomeworkAttempt {
    return {
      id: doc.id, studentId: doc.studentId, homeworkId: doc.homeworkId,
      attemptNumber: doc.attemptNumber,       status: doc.status as IHomeworkAttemptStatus,
      score: doc.score ?? undefined, passed: doc.passed ?? undefined,
      startedAt: formatFirestoreTimestamp(doc.startedAt),
      submittedAt: doc.submittedAt ? formatFirestoreTimestamp(doc.submittedAt) : undefined,
      gradedAt: doc.gradedAt ? formatFirestoreTimestamp(doc.gradedAt) : undefined,
      timeSpentSeconds: doc.timeSpentSeconds ?? undefined,
      contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
    };
  }

  static toCreate(input: {
    id: string; studentId: string; homeworkId: string; attemptNumber: number;
  }): HomeworkAttemptFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id, studentId: input.studentId, homeworkId: input.homeworkId,
      attemptNumber: input.attemptNumber, status: 'in_progress',
      startedAt: now, contentVersion: 1, createdAt: now, updatedAt: now,
    };
  }
}

export interface HomeworkAnswerFirestoreDoc {
  id: string;
  attemptId: string;
  studentId: string;
  homeworkId: string;
  questionId: string;
  answer: Record<string, unknown>;
  isCorrect?: boolean | null;
  score?: number | null;
  feedback?: string | null;
  submittedAt: Timestamp | string;
  createdAt: Timestamp | string;
}

export class HomeworkAnswerFirestoreMapper {
  static toDomain(doc: HomeworkAnswerFirestoreDoc): import('../contracts').IHomeworkAnswer {
    return {
      id: doc.id, attemptId: doc.attemptId, studentId: doc.studentId,
      homeworkId: doc.homeworkId, questionId: doc.questionId,
      answer: doc.answer, isCorrect: doc.isCorrect ?? undefined,
      score: doc.score ?? undefined, feedback: doc.feedback ?? undefined,
      submittedAt: formatFirestoreTimestamp(doc.submittedAt),
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }

  static toCreate(input: {
    id: string; attemptId: string; studentId: string; homeworkId: string;
    questionId: string; answer: Record<string, unknown>;
    isCorrect?: boolean | null; score?: number | null; feedback?: string | null;
  }): HomeworkAnswerFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id, attemptId: input.attemptId, studentId: input.studentId,
      homeworkId: input.homeworkId, questionId: input.questionId,
      answer: input.answer, isCorrect: input.isCorrect ?? null,
      score: input.score ?? null, feedback: input.feedback ?? null,
      submittedAt: now, createdAt: now,
    };
  }
}
