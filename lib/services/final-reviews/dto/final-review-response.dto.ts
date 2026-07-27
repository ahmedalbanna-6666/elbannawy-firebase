export interface FinalReviewOutput {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly displayOrder: number;
  readonly enabled: boolean;
  readonly published: boolean;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly lockedOverride: boolean | null;
  readonly createdBy: string;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface FinalReviewSummaryOutput {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly displayOrder: number;
  readonly enabled: boolean;
  readonly published: boolean;
  readonly isPremium: boolean;
  readonly lockedOverride: boolean | null;
  readonly createdAt: string;
}

export interface FinalReviewListOutput<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
