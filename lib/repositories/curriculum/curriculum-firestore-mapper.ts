import { Timestamp } from 'firebase-admin/firestore';
import { AcademicYear, AcademicYearSummary } from '../../domain/curriculum/entities/academic-year.entity';
import { AcademicTerm, AcademicTermSummary } from '../../domain/curriculum/entities/academic-term.entity';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';

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
