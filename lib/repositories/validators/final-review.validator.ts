import { z } from 'zod';

export const CreateFinalReviewInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  gradeId: z.string().min(1, 'Grade ID is required'),
  stageId: z.string().min(1, 'Stage ID is required'),
  academicYearId: z.string().min(1, 'Academic year ID is required'),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
  enabled: z.boolean().optional().default(true),
  published: z.boolean().optional().default(false),
  createdBy: z.string().min(1, 'Created by is required'),
  displayOrder: z.number().int().min(0),
  isPremium: z.boolean().optional().default(false),
  priceCoins: z.number().int().min(0).optional(),
  lockedOverride: z.boolean().nullable().optional().default(null),
});

export const UpdateFinalReviewInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  gradeId: z.string().min(1).optional(),
  stageId: z.string().min(1).optional(),
  academicYearId: z.string().min(1).optional(),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
  enabled: z.boolean().optional(),
  published: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isPremium: z.boolean().optional(),
  priceCoins: z.number().int().min(0).optional(),
  lockedOverride: z.boolean().nullable().optional(),
});

export const FinalReviewFilterSchema = z.object({
  gradeId: z.string().optional(),
  enabled: z.boolean().optional(),
  published: z.boolean().optional(),
  search: z.string().optional(),
});

export const FinalReviewIdSchema = z.string().min(1, 'Final review ID is required');
