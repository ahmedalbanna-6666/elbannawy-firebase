import { IBaseEntity } from '../../../shared/types/repository.types';

export interface Unit extends IBaseEntity {
  readonly id: string;
  readonly academicTermId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly published: boolean;
}

export interface UnitSummary {
  readonly id: string;
  readonly academicTermId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly published: boolean;
  readonly createdAt: string;
}
