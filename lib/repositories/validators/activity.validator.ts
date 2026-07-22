import { z } from 'zod';

const ActivityStatusEnum = z.enum(['draft', 'published', 'archived']);

export const ActivityMetadataSchema = z.object({
  estimatedDuration: z.number().int().min(0).optional(),
  skill: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  bloomLevel: z.string().max(50).optional(),
  aiGenerated: z.boolean().default(false),
});

export const ActivityConfigSchema = z.object({
  schemaVersion: z.number().int().min(1),
  data: z.unknown(),
});

export const CreateActivityInputSchema = z.object({
  id: z.string().min(1, 'Activity ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  type: z.string().min(1, 'Activity type is required'),
  title: z.string().min(1, 'Title is required').max(300),
  subtitle: z.string().max(500).optional(),
  instructions: z.string().max(5000).optional(),
  displayOrder: z.number().int().min(0),
  config: ActivityConfigSchema,
  status: ActivityStatusEnum.optional().default('draft'),
  isRequired: z.boolean().optional().default(true),
  isScorable: z.boolean().optional().default(true),
  isPractice: z.boolean().optional().default(false),
  timeLimit: z.number().int().min(0).optional(),
  maxAttempts: z.number().int().min(1).optional(),
  retryable: z.boolean().optional().default(false),
  prerequisiteActivityIds: z.array(z.string()).default([]),
  metadata: ActivityMetadataSchema.optional(),
});

export const UpdateActivityInputSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  subtitle: z.string().max(500).optional(),
  instructions: z.string().max(5000).optional(),
  displayOrder: z.number().int().min(0).optional(),
  config: ActivityConfigSchema.optional(),
  status: ActivityStatusEnum.optional(),
  isRequired: z.boolean().optional(),
  isScorable: z.boolean().optional(),
  isPractice: z.boolean().optional(),
  timeLimit: z.number().int().min(0).optional(),
  maxAttempts: z.number().int().min(1).optional(),
  retryable: z.boolean().optional(),
  prerequisiteActivityIds: z.array(z.string()).optional(),
  metadata: ActivityMetadataSchema.optional(),
});

export const ActivityFilterSchema = z.object({
  lessonId: z.string().optional(),
  type: z.string().optional(),
  status: ActivityStatusEnum.optional(),
  isRequired: z.boolean().optional(),
  isScorable: z.boolean().optional(),
  isPractice: z.boolean().optional(),
  search: z.string().optional(),
});

export const ActivityIdSchema = z.string().min(1, 'Activity ID is required');

export const ActivityManifestSchema = z.object({
  type: z.string().min(1),
  version: z.number().int().min(1),
  displayName: z.string().min(1).max(200),
  description: z.string().max(2000),
  category: z.string().min(1).max(100),
  renderer: z.string().min(1),
  validator: z.string().min(1),
  scorer: z.string().min(1),
  migration: z.string().optional(),
  capabilities: z.object({
    timed: z.boolean(),
    aiSupported: z.boolean(),
    retryable: z.boolean(),
    partialCredit: z.boolean(),
    attachments: z.boolean(),
    shuffle: z.boolean(),
    reviewable: z.boolean(),
  }),
});

export type CreateActivityType = z.infer<typeof CreateActivityInputSchema>;
export type UpdateActivityType = z.infer<typeof UpdateActivityInputSchema>;
export type ActivityFilterType = z.infer<typeof ActivityFilterSchema>;

export class ActivityValidator {
  validateCreate(input: Record<string, unknown>): string[] {
    const result = CreateActivityInputSchema.safeParse(input);
    if (!result.success) {
      return result.error.issues.map((i) => i.message);
    }
    return [];
  }

  validateUpdate(input: Record<string, unknown>): string[] {
    const result = UpdateActivityInputSchema.safeParse(input);
    if (!result.success) {
      return result.error.issues.map((i) => i.message);
    }
    return [];
  }

  validateFilter(input: Record<string, unknown>): string[] {
    const result = ActivityFilterSchema.safeParse(input);
    if (!result.success) {
      return result.error.issues.map((i) => i.message);
    }
    return [];
  }
}
