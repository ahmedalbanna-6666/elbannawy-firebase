import { z } from 'zod';

const AttemptStatusEnum = z.enum(['in_progress', 'submitted', 'graded', 'expired']);
const GradingMethodEnum = z.enum(['auto', 'manual', 'ai_assisted', 'practice']);

export const AttemptMetadataSchema = z.object({
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceType: z.string().optional(),
  submittedFrom: z.string().optional(),
});

export const CreateAttemptInputSchema = z.object({
  id: z.string().min(1, 'Attempt ID is required'),
  activityId: z.string().min(1, 'Activity ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  unitId: z.string().min(1, 'Unit ID is required'),
  attemptNumber: z.number().int().min(1),
  maxScore: z.number().min(0),
  gradingMethod: GradingMethodEnum.default('auto'),
  timeLimit: z.number().int().min(0).optional(),
  activitySchemaVersion: z.number().int().min(1),
  state: z.unknown().optional(),
});

export const UpdateAttemptInputSchema = z.object({
  answer: z.unknown().optional(),
  score: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  passed: z.boolean().optional(),
  feedback: z.string().max(2000).optional(),
  correctAnswer: z.unknown().optional(),
  submittedAt: z.string().datetime().optional(),
  timeSpent: z.number().int().min(0).optional(),
  status: AttemptStatusEnum.optional(),
  state: z.unknown().optional(),
});

export const AttemptFilterSchema = z.object({
  activityId: z.string().optional(),
  studentId: z.string().optional(),
  lessonId: z.string().optional(),
  unitId: z.string().optional(),
  status: AttemptStatusEnum.optional(),
  gradingMethod: GradingMethodEnum.optional(),
});

export const AttemptIdSchema = z.string().min(1, 'Attempt ID is required');

export const StartAttemptRequestSchema = z.object({
  studentId: z.string().min(1),
  lessonId: z.string().min(1),
  unitId: z.string().min(1),
});

export const SubmitAttemptRequestSchema = z.object({
  answer: z.unknown(),
  timeSpent: z.number().int().min(0),
});

export type CreateAttemptType = z.infer<typeof CreateAttemptInputSchema>;
export type UpdateAttemptType = z.infer<typeof UpdateAttemptInputSchema>;
export type AttemptFilterType = z.infer<typeof AttemptFilterSchema>;
