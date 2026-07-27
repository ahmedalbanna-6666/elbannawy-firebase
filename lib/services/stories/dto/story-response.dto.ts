export interface StoryOutput {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly lockedOverride: boolean | null;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StorySummaryOutput {
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

export interface StoryListOutput<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
