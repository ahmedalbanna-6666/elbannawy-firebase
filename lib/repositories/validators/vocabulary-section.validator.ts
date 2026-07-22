import { z } from 'zod';

export const VocabularySectionKindEnum = z.enum(['STANDARD_VOCABULARY', 'SYNONYM_ANTONYM']);

export const CreateVocabularySectionInputSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  kind: VocabularySectionKindEnum,
  title: z.string().nullable(),
  displayOrder: z.number().int().min(0, 'Display order must be non-negative'),
  sourceTableIndex: z.number().int().nullable(),
  sourceTitleRowIndex: z.number().int().nullable(),
});

export const UpdateVocabularySectionInputSchema = z.object({
  kind: VocabularySectionKindEnum.optional(),
  title: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const VocabularySectionFilterSchema = z.object({
  lessonId: z.string().optional(),
  kind: VocabularySectionKindEnum.optional(),
});

export type CreateVocabularySectionInputType = z.infer<typeof CreateVocabularySectionInputSchema>;
export type UpdateVocabularySectionInputType = z.infer<typeof UpdateVocabularySectionInputSchema>;
