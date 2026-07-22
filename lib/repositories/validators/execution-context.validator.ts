import { z } from 'zod';

const ExecutionModeEnum = z.enum(['view', 'practice', 'graded', 'review']);

export const ExecutionPermissionsSchema = z.object({
  canAttempt: z.boolean(),
  canRetry: z.boolean(),
  canReview: z.boolean(),
  canSkip: z.boolean(),
});

export const ExecutionSettingsSchema = z.object({
  locale: z.string().default('en'),
  direction: z.enum(['ltr', 'rtl']).default('ltr'),
  showFeedback: z.boolean().default(true),
  showCorrectAnswer: z.boolean().default(false),
  timeLimit: z.number().int().min(0).optional(),
});

export const ExecutionContextSchema = z.object({
  activity: z.unknown(),
  manifest: z.unknown(),
  attempt: z.unknown().optional(),
  mode: ExecutionModeEnum,
  permissions: ExecutionPermissionsSchema,
  settings: ExecutionSettingsSchema,
});

export type ExecutionContextType = z.infer<typeof ExecutionContextSchema>;
