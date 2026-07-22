export interface EducationalSystemOutput {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EducationalSystemSummaryOutput {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface StageOutput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StageSummaryOutput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface GradeOutput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly stageId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface GradeSummaryOutput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly stageId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface AcademicYearOutput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AcademicYearSummaryOutput {
  readonly id: string;
  readonly name: string;
  readonly isCurrent: boolean;
  readonly startDate: string;
  readonly endDate: string;
  readonly createdAt: string;
}

export interface AcademicTermOutput {
  readonly id: string;
  readonly academicYearId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AcademicTermSummaryOutput {
  readonly id: string;
  readonly academicYearId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isCurrent: boolean;
  readonly createdAt: string;
}

export interface CurrentAcademicContextOutput {
  readonly educationalSystem: EducationalSystemOutput | null;
  readonly stage: StageOutput | null;
  readonly grade: GradeOutput | null;
  readonly academicYear: AcademicYearOutput | null;
  readonly academicTerm: AcademicTermOutput | null;
}

export interface CurriculumListOutput<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
