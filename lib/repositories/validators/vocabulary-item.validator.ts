import { z } from 'zod';

export const CreateVocabularyItemInputSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  sectionId: z.string().nullable(),
  word: z.string().min(1, 'Word is required').max(255, 'Word must be 255 characters or less'),
  pronunciation: z.string().max(500, 'Pronunciation must be 500 characters or less').default(''),
  translation: z.string().min(1, 'Translation is required').max(500, 'Translation must be 500 characters or less'),
  definition: z.string().max(1000).nullable().optional(),
  example: z.string().max(1000).nullable().optional(),
  partOfSpeech: z.string().max(32).nullable().optional(),
  audioPath: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0, 'Display order must be non-negative'),
  sourceTableIndex: z.number().int().nullable().optional(),
  sourceRowIndex: z.number().int().nullable().optional(),
  sourcePairIndex: z.number().int().nullable().optional(),
});

export const UpdateVocabularyItemInputSchema = z.object({
  word: z.string().min(1).max(255).optional(),
  pronunciation: z.string().max(500).optional(),
  translation: z.string().min(1).max(500).optional(),
  definition: z.string().max(1000).nullable().optional(),
  example: z.string().max(1000).nullable().optional(),
  partOfSpeech: z.string().max(32).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const VocabularyItemFilterSchema = z.object({
  lessonId: z.string().optional(),
  sectionId: z.string().optional(),
});

export type CreateVocabularyItemInputType = z.infer<typeof CreateVocabularyItemInputSchema>;
export type UpdateVocabularyItemInputType = z.infer<typeof UpdateVocabularyItemInputSchema>;
