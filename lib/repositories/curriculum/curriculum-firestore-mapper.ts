import { Timestamp } from 'firebase-admin/firestore';
import { EducationalSystem, EducationalSystemSummary } from '../../domain/curriculum/entities/educational-system.entity';
import { Stage, StageSummary } from '../../domain/curriculum/entities/stage.entity';
import { Grade, GradeSummary } from '../../domain/curriculum/entities/grade.entity';
import { AcademicYear, AcademicYearSummary } from '../../domain/curriculum/entities/academic-year.entity';
import { AcademicTerm, AcademicTermSummary } from '../../domain/curriculum/entities/academic-term.entity';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';

export interface EducationalSystemFirestoreDoc {
  id: string;
  name: string;
  nameAr: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export interface StageFirestoreDoc {
  id: string;
  educationalSystemId: string;
  name: string;
  nameAr: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export interface GradeFirestoreDoc {
  id: string;
  educationalSystemId: string;
  stageId: string;
  name: string;
  nameAr: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export interface AcademicYearFirestoreDoc {
  id: string;
  educationalSystemId: string;
  name: string;
  nameAr: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export interface AcademicTermFirestoreDoc {
  id: string;
  academicYearId: string;
  name: string;
  nameAr: string;
  order: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class CurriculumFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static educationalSystemToDomain(doc: EducationalSystemFirestoreDoc): EducationalSystem {
    return {
      id: doc.id,
      name: doc.name,
      nameAr: doc.nameAr,
      description: doc.description ?? undefined,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static educationalSystemToSummary(doc: EducationalSystemFirestoreDoc): EducationalSystemSummary {
    return {
      id: doc.id,
      name: doc.name,
      nameAr: doc.nameAr,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }

  static stageToDomain(doc: StageFirestoreDoc): Stage {
    return {
      id: doc.id,
      educationalSystemId: doc.educationalSystemId,
      name: doc.name,
      nameAr: doc.nameAr,
      order: doc.order,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static stageToSummary(doc: StageFirestoreDoc): StageSummary {
    return {
      id: doc.id,
      educationalSystemId: doc.educationalSystemId,
      name: doc.name,
      nameAr: doc.nameAr,
      order: doc.order,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }

  static gradeToDomain(doc: GradeFirestoreDoc): Grade {
    return {
      id: doc.id,
      educationalSystemId: doc.educationalSystemId,
      stageId: doc.stageId,
      name: doc.name,
      nameAr: doc.nameAr,
      order: doc.order,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static gradeToSummary(doc: GradeFirestoreDoc): GradeSummary {
    return {
      id: doc.id,
      educationalSystemId: doc.educationalSystemId,
      stageId: doc.stageId,
      name: doc.name,
      nameAr: doc.nameAr,
      order: doc.order,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }

  static academicYearToDomain(doc: AcademicYearFirestoreDoc): AcademicYear {
    return {
      id: doc.id,
      educationalSystemId: doc.educationalSystemId,
      name: doc.name,
      nameAr: doc.nameAr,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isCurrent: doc.isCurrent,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static academicYearToSummary(doc: AcademicYearFirestoreDoc): AcademicYearSummary {
    return {
      id: doc.id,
      name: doc.name,
      isCurrent: doc.isCurrent,
      startDate: doc.startDate,
      endDate: doc.endDate,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }

  static academicTermToDomain(doc: AcademicTermFirestoreDoc): AcademicTerm {
    return {
      id: doc.id,
      academicYearId: doc.academicYearId,
      name: doc.name,
      nameAr: doc.nameAr,
      order: doc.order,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isCurrent: doc.isCurrent,
      isActive: doc.isActive,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static academicTermToSummary(doc: AcademicTermFirestoreDoc): AcademicTermSummary {
    return {
      id: doc.id,
      academicYearId: doc.academicYearId,
      name: doc.name,
      nameAr: doc.nameAr,
      order: doc.order,
      isCurrent: doc.isCurrent,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }
}
