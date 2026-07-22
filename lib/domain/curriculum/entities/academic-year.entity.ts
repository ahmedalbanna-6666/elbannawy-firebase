import { IBaseEntity } from '../../../shared/types/repository.types';

export interface AcademicYear extends IBaseEntity {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
  readonly isActive: boolean;
}

export interface AcademicYearSummary {
  readonly id: string;
  readonly name: string;
  readonly isCurrent: boolean;
  readonly startDate: string;
  readonly endDate: string;
  readonly createdAt: string;
}
