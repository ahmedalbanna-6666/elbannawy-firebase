import { z } from 'zod';

export const CreateStoryInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  gradeId: z.string().min(1, 'Grade ID is required'),
  stageId: z.string().min(1, 'Stage ID is required'),
  educationalSystemId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year ID is required'),
  termId: z.string().min(1, 'Term ID is required'),
  displayOrder: z.number().int().min(0),
  published: z.boolean().optional().default(false),
  isPremium: z.boolean().optional().default(false),
  priceCoins: z.number().int().min(0).optional(),
  lockedOverride: z.boolean().nullable().optional().default(null),
});

export const UpdateStoryInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  gradeId: z.string().min(1).optional(),
  stageId: z.string().min(1).optional(),
  educationalSystemId: z.string().optional(),
  academicYearId: z.string().min(1).optional(),
  termId: z.string().min(1).optional(),
  displayOrder: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  priceCoins: z.number().int().min(0).optional(),
  lockedOverride: z.boolean().nullable().optional(),
});

export const StoryFilterSchema = z.object({
  gradeId: z.string().optional(),
  published: z.boolean().optional(),
  search: z.string().optional(),
});

export const StoryIdSchema = z.string().min(1, 'Story ID is required');
