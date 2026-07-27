import { Timestamp } from 'firebase-admin/firestore';
import { FinalReview, FinalReviewSummary } from '../../domain/final-reviews/entities/final-review.entity';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';

export interface FinalReviewFirestoreDoc {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  gradeId: string;
  stageId: string;
  academicYearId: string;
  opensAt: string;
  closesAt: string;
  enabled: boolean;
  published: boolean;
  createdBy: string;
  displayOrder: number;
  isPremium: boolean;
  priceCoins?: number;
  lockedOverride: boolean | null;
  contentVersion: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class FinalReviewFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: FinalReviewFirestoreDoc): FinalReview {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? undefined,
      coverImageUrl: doc.coverImageUrl ?? undefined,
      gradeId: doc.gradeId,
      stageId: doc.stageId,
      academicYearId: doc.academicYearId,
      opensAt: doc.opensAt,
      closesAt: doc.closesAt,
      enabled: doc.enabled,
      published: doc.published,
      createdBy: doc.createdBy,
      displayOrder: doc.displayOrder,
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

  static toSummary(doc: FinalReviewFirestoreDoc): FinalReviewSummary {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? undefined,
      coverImageUrl: doc.coverImageUrl ?? undefined,
      gradeId: doc.gradeId,
      stageId: doc.stageId,
      displayOrder: doc.displayOrder,
      published: doc.published,
      enabled: doc.enabled,
      isPremium: doc.isPremium,
      lockedOverride: doc.lockedOverride ?? null,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }
}
