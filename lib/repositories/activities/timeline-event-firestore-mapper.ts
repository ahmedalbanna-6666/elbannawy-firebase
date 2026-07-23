import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { ITimelineEvent, TimelineEventType } from '../contracts';

export interface TimelineEventFirestoreDoc {
  id: string;
  videoId: string;
  lessonId: string;
  activityId: string;
  timestampSeconds: number;
  eventType: string;
  required: boolean;
  enabled: boolean;
  displayOrder: number;
  contentVersion: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class TimelineEventFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: TimelineEventFirestoreDoc): ITimelineEvent {
    return {
      id: doc.id,
      videoId: doc.videoId,
      lessonId: doc.lessonId,
      activityId: doc.activityId,
      timestampSeconds: doc.timestampSeconds,
      eventType: doc.eventType as TimelineEventType,
      required: doc.required,
      enabled: doc.enabled,
      displayOrder: doc.displayOrder,
      contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toCreate(input: {
    id: string; videoId: string; lessonId: string; activityId: string;
    timestampSeconds: number; eventType: string; required: boolean;
    enabled: boolean; displayOrder: number;
  }): TimelineEventFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      videoId: input.videoId,
      lessonId: input.lessonId,
      activityId: input.activityId,
      timestampSeconds: input.timestampSeconds,
      eventType: input.eventType,
      required: input.required,
      enabled: input.enabled,
      displayOrder: input.displayOrder,
      contentVersion: 1,
      createdAt: now,
      updatedAt: now,
      schemaVersion: TimelineEventFirestoreMapper.SCHEMA_VERSION,
      deletedAt: null,
    };
  }
}
