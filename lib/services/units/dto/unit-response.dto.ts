export interface UnitOutput {
  readonly id: string;
  readonly academicTermId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly published: boolean;
  readonly lockedOverride: boolean | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UnitSummaryOutput {
  readonly id: string;
  readonly academicTermId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly published: boolean;
  readonly lockedOverride: boolean | null;
  readonly createdAt: string;
}

export interface UnitListOutput<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
