import { IBaseEntity } from '../../../shared/types/repository.types';

export interface AcademicTerm extends IBaseEntity {
  readonly id: string;
  readonly academicYearId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
  readonly isActive: boolean;
}

export interface AcademicTermSummary {
  readonly id: string;
  readonly academicYearId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isCurrent: boolean;
  readonly createdAt: string;
}
