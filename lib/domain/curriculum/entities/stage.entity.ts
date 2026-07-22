import { IBaseEntity } from '../../../shared/types/repository.types';

export interface Stage extends IBaseEntity {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
}

export interface StageSummary {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}
