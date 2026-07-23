import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { IVideoProgress } from '../contracts';

export interface VideoProgressFirestoreDoc {
  id: string;
  userId: string;
  videoId: string;
  lessonId: string;
  lastPositionSeconds: number;
  watchedSeconds: number;
  watchPercent: number;
  completed: boolean;
  completedAt?: Timestamp | string | null;
  lastActiveAt: Timestamp | string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export class VideoProgressFirestoreMapper {
  static toDomain(doc: VideoProgressFirestoreDoc): IVideoProgress {
    return {
      id: doc.id,
      userId: doc.userId,
      videoId: doc.videoId,
      lessonId: doc.lessonId,
      lastPositionSeconds: doc.lastPositionSeconds,
      watchedSeconds: doc.watchedSeconds,
      watchPercent: doc.watchPercent,
      completed: doc.completed,
      completedAt: doc.completedAt ? formatFirestoreTimestamp(doc.completedAt) : undefined,
      lastActiveAt: formatFirestoreTimestamp(doc.lastActiveAt),
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
    };
  }

  static toCreate(input: {
    id: string; userId: string; videoId: string; lessonId: string;
    lastPositionSeconds: number; watchedSeconds: number;
  }): VideoProgressFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      userId: input.userId,
      videoId: input.videoId,
      lessonId: input.lessonId,
      lastPositionSeconds: input.lastPositionSeconds,
      watchedSeconds: input.watchedSeconds,
      watchPercent: 0,
      completed: false,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }
}
