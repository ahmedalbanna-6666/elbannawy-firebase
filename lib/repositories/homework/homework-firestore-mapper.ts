import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { IHomework } from '../contracts';

export interface HomeworkFirestoreDoc {
  id: string;
  lessonId: string;
  title: string;
  instructions?: string | null;
  passingScore: number;
  maxAttempts: number;
  unlimitedAttempts: boolean;
  published: boolean;
  allowRetry: boolean;
  showAnswers: boolean;
  xpReward: number;
  contentVersion: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class HomeworkFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: HomeworkFirestoreDoc): IHomework {
    return {
      id: doc.id,
      lessonId: doc.lessonId,
      title: doc.title,
      instructions: doc.instructions ?? undefined,
      passingScore: doc.passingScore,
      maxAttempts: doc.maxAttempts,
      unlimitedAttempts: doc.unlimitedAttempts,
      published: doc.published,
      allowRetry: doc.allowRetry,
      showAnswers: doc.showAnswers,
      xpReward: doc.xpReward,
      contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toCreate(input: {
    id: string; lessonId: string; title: string; instructions?: string | null;
    passingScore: number; maxAttempts: number; unlimitedAttempts: boolean;
    published: boolean; allowRetry: boolean; showAnswers: boolean; xpReward: number;
  }): HomeworkFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      lessonId: input.lessonId,
      title: input.title,
      instructions: input.instructions ?? null,
      passingScore: input.passingScore,
      maxAttempts: input.maxAttempts,
      unlimitedAttempts: input.unlimitedAttempts,
      published: input.published,
      allowRetry: input.allowRetry,
      showAnswers: input.showAnswers,
      xpReward: input.xpReward,
      contentVersion: 1,
      createdAt: now,
      updatedAt: now,
      schemaVersion: HomeworkFirestoreMapper.SCHEMA_VERSION,
      deletedAt: null,
    };
  }
}
