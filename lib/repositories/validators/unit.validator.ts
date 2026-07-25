import { z } from 'zod';

export const CreateUnitInputSchema = z.object({
  id: z.string().min(1, 'Unit ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  gradeId: z.string().optional(),
  academicYearId: z.string().optional(),
  educationalSystemId: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(200),
  nameAr: z.string().min(1, 'Arabic name is required').max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0),
  isActive: z.boolean().optional().default(true),
  isPremium: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  lockedOverride: z.boolean().nullable().optional().default(null),
});

export const UpdateUnitInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameAr: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
  gradeId: z.string().optional(),
  academicYearId: z.string().optional(),
  educationalSystemId: z.string().optional(),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  published: z.boolean().optional(),
  lockedOverride: z.boolean().nullable().optional(),
});

export const UnitFilterSchema = z.object({
  academicTermId: z.string().optional(),
  gradeId: z.string().optional(),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  published: z.boolean().optional(),
  search: z.string().optional(),
});

export const UnitIdSchema = z.string().min(1, 'Unit ID is required');
