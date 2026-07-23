import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { IQuiz } from '../contracts';

export interface QuizFirestoreDoc {
  id: string; lessonId: string; title: string; instructions?: string | null;
  passingScore: number; maxAttempts: number; unlimitedAttempts: boolean;
  published: boolean; allowRetry: boolean; showAnswers: boolean;
  xpReward: number; requiredForCompletion: boolean; contentVersion: number;
  createdAt: Timestamp | string; updatedAt: Timestamp | string;
  schemaVersion: number; deletedAt?: Timestamp | string | null;
}

export class QuizFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;
  static toDomain(doc: QuizFirestoreDoc): IQuiz {
    return {
      id: doc.id, lessonId: doc.lessonId, title: doc.title,
      instructions: doc.instructions ?? undefined, passingScore: doc.passingScore,
      maxAttempts: doc.maxAttempts, unlimitedAttempts: doc.unlimitedAttempts,
      published: doc.published, allowRetry: doc.allowRetry, showAnswers: doc.showAnswers,
      xpReward: doc.xpReward, requiredForCompletion: doc.requiredForCompletion,
      contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }
  static toCreate(input: Record<string, unknown>): QuizFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id as string, lessonId: input.lessonId as string,
      title: input.title as string, instructions: (input.instructions as string) ?? null,
      passingScore: (input.passingScore as number) ?? 60, maxAttempts: (input.maxAttempts as number) ?? 3,
      unlimitedAttempts: (input.unlimitedAttempts as boolean) ?? false,
      published: (input.published as boolean) ?? false, allowRetry: (input.allowRetry as boolean) ?? true,
      showAnswers: (input.showAnswers as boolean) ?? false, xpReward: (input.xpReward as number) ?? 20,
      requiredForCompletion: (input.requiredForCompletion as boolean) ?? true, contentVersion: 1,
      createdAt: now, updatedAt: now, schemaVersion: QuizFirestoreMapper.SCHEMA_VERSION, deletedAt: null,
    };
  }
}

export interface QuizQuestionFirestoreDoc {
  id: string; quizId: string; questionType: string; prompt: string;
  instructions?: string | null; explanation?: string | null;
  options: Record<string, string> | null; points: number; displayOrder: number;
  contentVersion: number; createdAt: Timestamp | string; updatedAt: Timestamp | string; schemaVersion: number;
}

export class QuizQuestionFirestoreMapper {
  static toDomain(doc: QuizQuestionFirestoreDoc): import('../contracts').IQuizQuestion {
    return {
      id: doc.id, quizId: doc.quizId, questionType: doc.questionType as import('../contracts').QuestionType,
      prompt: doc.prompt, instructions: doc.instructions ?? undefined, explanation: doc.explanation ?? undefined,
      options: doc.options, points: doc.points, displayOrder: doc.displayOrder, contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt), updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
    };
  }
  static toCreate(input: Record<string, unknown>): QuizQuestionFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id as string, quizId: input.quizId as string, questionType: input.questionType as string,
      prompt: input.prompt as string, instructions: (input.instructions as string) ?? null,
      explanation: (input.explanation as string) ?? null, options: (input.options as Record<string, string>) ?? null,
      points: (input.points as number) ?? 1, displayOrder: input.displayOrder as number, contentVersion: 1,
      createdAt: now, updatedAt: now, schemaVersion: 1,
    };
  }
}

export interface QuizAttemptFirestoreDoc {
  id: string; studentId: string; quizId: string; attemptNumber: number;
  status: string; score?: number | null; passed?: boolean | null;
  startedAt: Timestamp | string; submittedAt?: Timestamp | string | null;
  gradedAt?: Timestamp | string | null; timeSpentSeconds?: number | null;
  contentVersion: number; createdAt: Timestamp | string; updatedAt: Timestamp | string;
}

export class QuizAttemptFirestoreMapper {
  static toDomain(doc: QuizAttemptFirestoreDoc): import('../contracts').IQuizAttempt {
    return {
      id: doc.id, studentId: doc.studentId, quizId: doc.quizId, attemptNumber: doc.attemptNumber,
      status: doc.status as import('../contracts').IHomeworkAttemptStatus,
      score: doc.score ?? undefined, passed: doc.passed ?? undefined,
      startedAt: formatFirestoreTimestamp(doc.startedAt),
      submittedAt: doc.submittedAt ? formatFirestoreTimestamp(doc.submittedAt) : undefined,
      gradedAt: doc.gradedAt ? formatFirestoreTimestamp(doc.gradedAt) : undefined,
      timeSpentSeconds: doc.timeSpentSeconds ?? undefined, contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt), updatedAt: formatFirestoreTimestamp(doc.updatedAt),
    };
  }
  static toCreate(input: { id: string; studentId: string; quizId: string; attemptNumber: number }): QuizAttemptFirestoreDoc {
    const now = Timestamp.now();
    return { id: input.id, studentId: input.studentId, quizId: input.quizId, attemptNumber: input.attemptNumber, status: 'in_progress', startedAt: now, contentVersion: 1, createdAt: now, updatedAt: now };
  }
}

export interface QuizAnswerFirestoreDoc {
  id: string; attemptId: string; studentId: string; quizId: string; questionId: string;
  answer: Record<string, unknown>; isCorrect?: boolean | null; score?: number | null;
  feedback?: string | null; submittedAt: Timestamp | string; createdAt: Timestamp | string;
}

export class QuizAnswerFirestoreMapper {
  static toDomain(doc: QuizAnswerFirestoreDoc): import('../contracts').IQuizAnswer {
    return {
      id: doc.id, attemptId: doc.attemptId, studentId: doc.studentId, quizId: doc.quizId, questionId: doc.questionId,
      answer: doc.answer, isCorrect: doc.isCorrect ?? undefined, score: doc.score ?? undefined,
      feedback: doc.feedback ?? undefined, submittedAt: formatFirestoreTimestamp(doc.submittedAt),
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }
  static toCreate(input: Record<string, unknown>): QuizAnswerFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id as string, attemptId: input.attemptId as string, studentId: input.studentId as string,
      quizId: input.quizId as string, questionId: input.questionId as string,
      answer: input.answer as Record<string, unknown>, isCorrect: (input.isCorrect as boolean) ?? null,
      score: (input.score as number) ?? null, feedback: (input.feedback as string) ?? null, submittedAt: now, createdAt: now,
    };
  }
}
