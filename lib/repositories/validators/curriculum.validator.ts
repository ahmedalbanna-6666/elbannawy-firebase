import { z } from 'zod';

export const CreateAcademicYearInputSchema = z.object({
  id: z.string().min(1, 'Academic year ID is required'),
  educationalSystemId: z.string().min(1, 'Educational system ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  nameAr: z.string().min(1, 'Arabic name is required').max(200),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const UpdateAcademicYearInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameAr: z.string().min(1).max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const CreateAcademicTermInputSchema = z.object({
  id: z.string().min(1, 'Academic term ID is required'),
  academicYearId: z.string().min(1, 'Academic year ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  nameAr: z.string().min(1, 'Arabic name is required').max(200),
  order: z.number().int().min(0),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const UpdateAcademicTermInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameAr: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const CurriculumFilterSchema = z.object({
  educationalSystemId: z.string().optional(),
  stageId: z.string().optional(),
  gradeId: z.string().optional(),
  academicYearId: z.string().optional(),
  isActive: z.boolean().optional(),
  isCurrent: z.boolean().optional(),
  search: z.string().optional(),
});

export const CurriculumIdSchema = z.string().min(1, 'ID is required');

export const SetCurrentAcademicYearSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year ID is required'),
});

export const SetCurrentAcademicTermSchema = z.object({
  academicTermId: z.string().min(1, 'Academic term ID is required'),
});
