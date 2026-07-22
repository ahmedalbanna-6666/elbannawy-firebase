import { z } from 'zod';

const LessonStatusEnum = z.enum(['draft', 'published', 'archived']);

export const CreateLessonInputSchema = z.object({
  id: z.string().min(1, 'Lesson ID is required'),
  unitId: z.string().min(1, 'Unit ID is required'),
  title: z.string().min(1, 'Title is required').max(300),
  slug: z.string().min(1, 'Slug is required').max(300).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(5000).optional(),
  displayOrder: z.number().int().min(0),
  status: LessonStatusEnum.optional().default('draft'),
  isPublished: z.boolean().optional().default(false),
  isVisible: z.boolean().optional().default(true),
  estimatedDuration: z.number().int().min(1).optional(),
});

export const UpdateLessonInputSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  description: z.string().max(5000).optional(),
  displayOrder: z.number().int().min(0).optional(),
  status: LessonStatusEnum.optional(),
  isPublished: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  estimatedDuration: z.number().int().min(1).optional(),
});

export const LessonFilterSchema = z.object({
  unitId: z.string().optional(),
  status: LessonStatusEnum.optional(),
  isPublished: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  search: z.string().optional(),
});

export const LessonIdSchema = z.string().min(1, 'Lesson ID is required');

export const ChangeOrderSchema = z.object({
  displayOrder: z.number().int().min(0),
});
