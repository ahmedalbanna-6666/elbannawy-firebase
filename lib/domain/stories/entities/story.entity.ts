import { IBaseEntity } from '../../../shared/types/repository.types';

export interface Story extends IBaseEntity {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly educationalSystemId?: string;
  readonly academicYearId: string;
  readonly termId: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly lockedOverride: boolean | null;
  readonly contentVersion: number;
}

export interface StorySummary {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly isPremium: boolean;
  readonly lockedOverride: boolean | null;
  readonly createdAt: string;
}
