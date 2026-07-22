import { IBaseEntity } from '../../../shared/types/repository.types';

export interface EducationalSystem extends IBaseEntity {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly isActive: boolean;
}

export interface EducationalSystemSummary {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}
