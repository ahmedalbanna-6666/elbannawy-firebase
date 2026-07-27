import { IBaseEntity } from '../../../shared/types/repository.types';

export interface FinalReview extends IBaseEntity {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly academicYearId: string;
  readonly opensAt: string;
  readonly closesAt: string;
  readonly enabled: boolean;
  readonly published: boolean;
  readonly createdBy: string;
  readonly displayOrder: number;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly lockedOverride: boolean | null;
  readonly contentVersion: number;
}

export interface FinalReviewSummary {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly enabled: boolean;
  readonly isPremium: boolean;
  readonly lockedOverride: boolean | null;
  readonly createdAt: string;
}
