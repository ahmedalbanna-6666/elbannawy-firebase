import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { ILessonDocument, DocumentProcessingStatus } from '../contracts';

export interface LessonDocumentFirestoreDoc {
  id: string;
  lessonId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  processingStatus: string;
  downloadable: boolean;
  extractedAt?: Timestamp | string | null;
  errorCode?: string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

export class LessonDocumentFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: LessonDocumentFirestoreDoc): ILessonDocument {
    return {
      id: doc.id,
      lessonId: doc.lessonId,
      storagePath: doc.storagePath,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      sha256: doc.sha256,
      processingStatus: doc.processingStatus as DocumentProcessingStatus,
      downloadable: doc.downloadable,
      extractedAt: doc.extractedAt ? formatFirestoreTimestamp(doc.extractedAt) : undefined,
      errorCode: doc.errorCode ?? undefined,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toCreate(input: {
    id: string;
    lessonId: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    sha256: string;
    processingStatus: string;
    downloadable: boolean;
  }): LessonDocumentFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      lessonId: input.lessonId,
      storagePath: input.storagePath,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      sha256: input.sha256,
      processingStatus: input.processingStatus,
      downloadable: input.downloadable,
      extractedAt: null,
      errorCode: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: LessonDocumentFirestoreMapper.SCHEMA_VERSION,
      deletedAt: null,
    };
  }
}
