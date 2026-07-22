import { z } from 'zod';

const LessonProgressStatusEnum = z.enum(['not_started', 'in_progress', 'completed']);

export const CreateLessonProgressInputSchema = z.object({
  id: z.string().min(1, 'Progress ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  unitId: z.string().min(1, 'Unit ID is required'),
  totalActivities: z.number().int().min(0),
});

export const UpdateLessonProgressInputSchema = z.object({
  status: LessonProgressStatusEnum.optional(),
  completedActivities: z.number().int().min(0).optional(),
  totalActivities: z.number().int().min(0).optional(),
  score: z.number().min(0).optional(),
  maxScore: z.number().min(0).optional(),
  lastActivityId: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export const ProgressIdSchema = z.string().min(1, 'Progress ID is required');

export type CreateLessonProgressType = z.infer<typeof CreateLessonProgressInputSchema>;
export type UpdateLessonProgressType = z.infer<typeof UpdateLessonProgressInputSchema>;
