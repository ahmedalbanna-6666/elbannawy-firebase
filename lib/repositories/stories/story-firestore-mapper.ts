import { Timestamp } from 'firebase-admin/firestore';
import { Story, StorySummary } from '../../domain/stories/entities/story.entity';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';

export interface StoryFirestoreDoc {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  gradeId: string;
  stageId: string;
  educationalSystemId?: string | null;
  academicYearId: string;
  termId: string;
  displayOrder: number;
  published: boolean;
  isPremium: boolean;
  priceCoins?: number;
  lockedOverride: boolean | null;
  contentVersion: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class StoryFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: StoryFirestoreDoc): Story {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? undefined,
      coverImageUrl: doc.coverImageUrl ?? undefined,
      gradeId: doc.gradeId,
      stageId: doc.stageId,
      educationalSystemId: doc.educationalSystemId ?? undefined,
      academicYearId: doc.academicYearId,
      termId: doc.termId,
      displayOrder: doc.displayOrder,
      published: doc.published,
      isPremium: doc.isPremium,
      priceCoins: doc.priceCoins,
      lockedOverride: doc.lockedOverride ?? null,
      contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toSummary(doc: StoryFirestoreDoc): StorySummary {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? undefined,
      coverImageUrl: doc.coverImageUrl ?? undefined,
      gradeId: doc.gradeId,
      stageId: doc.stageId,
      displayOrder: doc.displayOrder,
      published: doc.published,
      isPremium: doc.isPremium,
      lockedOverride: doc.lockedOverride ?? null,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }
}
