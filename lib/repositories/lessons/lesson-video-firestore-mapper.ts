import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { ILessonVideo, VideoProvider } from '../contracts';

export interface LessonVideoFirestoreDoc {
  id: string;
  lessonId: string;
  title: string;
  provider: string;
  providerVideoId: string;
  providerUrl: string;
  durationSeconds: number;
  thumbnailUrl?: string | null;
  displayOrder: number;
  enabled: boolean;
  interactiveTimelineEnabled: boolean;
  contentVersion: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class LessonVideoFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: LessonVideoFirestoreDoc): ILessonVideo {
    return {
      id: doc.id,
      lessonId: doc.lessonId,
      title: doc.title,
      provider: doc.provider as VideoProvider,
      providerVideoId: doc.providerVideoId,
      providerUrl: doc.providerUrl,
      durationSeconds: doc.durationSeconds,
      thumbnailUrl: doc.thumbnailUrl ?? undefined,
      displayOrder: doc.displayOrder,
      enabled: doc.enabled,
      interactiveTimelineEnabled: doc.interactiveTimelineEnabled,
      contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toCreate(input: {
    id: string;
    lessonId: string;
    title: string;
    provider: string;
    providerVideoId: string;
    providerUrl: string;
    durationSeconds: number;
    thumbnailUrl?: string;
    displayOrder: number;
    enabled: boolean;
    interactiveTimelineEnabled: boolean;
  }): LessonVideoFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      lessonId: input.lessonId,
      title: input.title,
      provider: input.provider,
      providerVideoId: input.providerVideoId,
      providerUrl: input.providerUrl,
      durationSeconds: input.durationSeconds,
      thumbnailUrl: input.thumbnailUrl ?? null,
      displayOrder: input.displayOrder,
      enabled: input.enabled,
      interactiveTimelineEnabled: input.interactiveTimelineEnabled,
      contentVersion: 1,
      createdAt: now,
      updatedAt: now,
      schemaVersion: LessonVideoFirestoreMapper.SCHEMA_VERSION,
      deletedAt: null,
    };
  }
}
