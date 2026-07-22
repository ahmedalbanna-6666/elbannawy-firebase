import { IBaseEntity } from '../../../shared/types/repository.types';

export interface Grade extends IBaseEntity {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly stageId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
}

export interface GradeSummary {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly stageId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}
