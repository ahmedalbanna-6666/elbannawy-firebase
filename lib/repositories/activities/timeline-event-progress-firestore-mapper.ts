import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { ITimelineEventProgress } from '../contracts';

export interface TimelineEventProgressFirestoreDoc {
  id: string;
  userId: string;
  videoId: string;
  lessonId: string;
  timelineEventId: string;
  activityId: string;
  completed: boolean;
  skipped: boolean;
  completedAt?: Timestamp | string | null;
  attemptCount: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export class TimelineEventProgressFirestoreMapper {
  static toDomain(doc: TimelineEventProgressFirestoreDoc): ITimelineEventProgress {
    return {
      id: doc.id,
      userId: doc.userId,
      videoId: doc.videoId,
      lessonId: doc.lessonId,
      timelineEventId: doc.timelineEventId,
      activityId: doc.activityId,
      completed: doc.completed,
      skipped: doc.skipped,
      completedAt: doc.completedAt ? formatFirestoreTimestamp(doc.completedAt) : undefined,
      attemptCount: doc.attemptCount,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
    };
  }

  static toCreate(input: {
    id: string; userId: string; videoId: string; lessonId: string;
    timelineEventId: string; activityId: string;
  }): TimelineEventProgressFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      userId: input.userId,
      videoId: input.videoId,
      lessonId: input.lessonId,
      timelineEventId: input.timelineEventId,
      activityId: input.activityId,
      completed: false,
      skipped: false,
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
}
