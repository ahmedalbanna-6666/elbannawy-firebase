import { Timestamp } from 'firebase-admin/firestore';
import { Unit, UnitSummary } from '../../domain/units/entities/unit.entity';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';

export interface UnitFirestoreDoc {
  id: string;
  academicTermId: string;
  name: string;
  nameAr: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  isPremium: boolean;
  published: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class UnitFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: UnitFirestoreDoc): Unit {
    return {
      id: doc.id,
      academicTermId: doc.academicTermId,
      name: doc.name,
      nameAr: doc.nameAr,
      description: doc.description ?? undefined,
      order: doc.order,
      isActive: doc.isActive,
      isPremium: doc.isPremium,
      published: doc.published,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toSummary(doc: UnitFirestoreDoc): UnitSummary {
    return {
      id: doc.id,
      academicTermId: doc.academicTermId,
      name: doc.name,
      nameAr: doc.nameAr,
      order: doc.order,
      isActive: doc.isActive,
      isPremium: doc.isPremium,
      published: doc.published,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }
}
