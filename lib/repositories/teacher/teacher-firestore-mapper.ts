import { Timestamp } from 'firebase-admin/firestore';
import type { TeacherAssignment } from '../contracts';

export interface TeacherAssignmentFirestoreDoc {
  id: string;
  teacherId: string;
  gradeId: string;
  academicYearId: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: number;
  deletedAt: Timestamp | null;
}

export function teacherAssignmentToDomain(doc: TeacherAssignmentFirestoreDoc): TeacherAssignment {
  return {
    id: doc.id,
    teacherId: doc.teacherId,
    gradeId: doc.gradeId,
    academicYearId: doc.academicYearId,
    status: doc.status,
    createdAt: doc.createdAt instanceof Timestamp ? doc.createdAt.toDate().toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Timestamp ? doc.updatedAt.toDate().toISOString() : String(doc.updatedAt),
  };
}

export function teacherAssignmentToFirestore(entity: Partial<TeacherAssignment>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (entity.teacherId !== undefined) data.teacherId = entity.teacherId;
  if (entity.gradeId !== undefined) data.gradeId = entity.gradeId;
  if (entity.academicYearId !== undefined) data.academicYearId = entity.academicYearId;
  if (entity.status !== undefined) data.status = entity.status;
  return data;
}

export const TeacherAssignmentMapper = {
  SCHEMA_VERSION: 1,
  toDomain: teacherAssignmentToDomain,
  toFirestore: teacherAssignmentToFirestore,
};
