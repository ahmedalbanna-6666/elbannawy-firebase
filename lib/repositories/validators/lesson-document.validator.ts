import { z } from 'zod';

export const DocumentProcessingStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);

export const CreateLessonDocumentInputSchema = z.object({
  id: z.string().min(1).max(128),
  lessonId: z.string().min(1).max(128),
  storagePath: z.string().min(1).max(1000),
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  fileSizeBytes: z.number().int().min(0),
  sha256: z.string().min(1).max(128),
  processingStatus: DocumentProcessingStatusEnum.optional().default('pending'),
  downloadable: z.boolean().optional().default(false),
});

export const UpdateLessonDocumentInputSchema = z.object({
  processingStatus: DocumentProcessingStatusEnum.optional(),
  downloadable: z.boolean().optional(),
  extractedAt: z.string().optional(),
  errorCode: z.string().max(500).optional(),
});

export const LessonDocumentIdSchema = z.string().min(1).max(128);

export type CreateLessonDocumentInputType = z.infer<typeof CreateLessonDocumentInputSchema>;
export type UpdateLessonDocumentInputType = z.infer<typeof UpdateLessonDocumentInputSchema>;
