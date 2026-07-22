import { z } from 'zod';

export const VocabularyRelationTypeEnum = z.enum(['SYNONYM', 'ANTONYM']);

export const CreateVocabularyRelationInputSchema = z.object({
  id: z.string().min(1, 'Relation ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  primaryItemId: z.string().min(1, 'Primary item ID is required'),
  relationType: VocabularyRelationTypeEnum,
  relatedWord: z.string().min(1, 'Related word is required').max(255),
  relatedTranslation: z.string().max(500).nullable().optional(),
  displayOrder: z.number().int().min(0, 'Display order must be non-negative'),
  sourceTableIndex: z.number().int().nullable().optional(),
  sourceRowIndex: z.number().int().nullable().optional(),
});

export const UpdateVocabularyRelationInputSchema = z.object({
  relationType: VocabularyRelationTypeEnum.optional(),
  relatedWord: z.string().min(1).max(255).optional(),
  relatedTranslation: z.string().max(500).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const VocabularyRelationFilterSchema = z.object({
  lessonId: z.string().optional(),
  sectionId: z.string().optional(),
});

export type CreateVocabularyRelationInputType = z.infer<typeof CreateVocabularyRelationInputSchema>;
export type UpdateVocabularyRelationInputType = z.infer<typeof UpdateVocabularyRelationInputSchema>;
