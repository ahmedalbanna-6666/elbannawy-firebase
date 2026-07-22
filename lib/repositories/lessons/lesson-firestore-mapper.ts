import { Timestamp } from 'firebase-admin/firestore';
import { Lesson, LessonSummary } from '../../domain/lessons/entities/lesson.entity';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';

export interface LessonFirestoreDoc {
  id: string;
  unitId: string;
  title: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  status: string;
  isPublished: boolean;
  isVisible: boolean;
  estimatedDuration?: number | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Class convention matches UnitFirestoreMapper
export class LessonFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: LessonFirestoreDoc): Lesson {
    return {
      id: doc.id,
      unitId: doc.unitId,
      title: doc.title,
      slug: doc.slug,
      description: doc.description ?? undefined,
      displayOrder: doc.displayOrder,
      status: doc.status as Lesson['status'],
      isPublished: doc.isPublished,
      isVisible: doc.isVisible,
      estimatedDuration: doc.estimatedDuration ?? undefined,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toSummary(doc: LessonFirestoreDoc): LessonSummary {
    return {
      id: doc.id,
      unitId: doc.unitId,
      title: doc.title,
      slug: doc.slug,
      displayOrder: doc.displayOrder,
      status: doc.status as Lesson['status'],
      isPublished: doc.isPublished,
      isVisible: doc.isVisible,
      estimatedDuration: doc.estimatedDuration ?? undefined,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }
}
