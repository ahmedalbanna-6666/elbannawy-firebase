import { z } from 'zod';

export const TeacherAssignmentIdSchema = z.string().min(1).max(128);

export const CreateTeacherAssignmentInputSchema = z.object({
  id: z.string().min(1).max(128),
  teacherId: z.string().min(1).max(128),
  gradeId: z.string().min(1).max(128),
  academicYearId: z.string().min(1).max(128),
});

export const TeacherAssignmentFilterSchema = z.object({
  teacherId: z.string().max(128).optional(),
  gradeId: z.string().max(128).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type CreateTeacherAssignmentType = z.infer<typeof CreateTeacherAssignmentInputSchema>;
export type TeacherAssignmentFilterType = z.infer<typeof TeacherAssignmentFilterSchema>;
