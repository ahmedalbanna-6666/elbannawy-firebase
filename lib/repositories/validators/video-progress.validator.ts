import { z } from 'zod';

export const CreateVideoProgressInputSchema = z.object({
  id: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  videoId: z.string().min(1).max(128),
  lessonId: z.string().min(1).max(128),
  lastPositionSeconds: z.number().int().min(0).optional().default(0),
  watchedSeconds: z.number().int().min(0).optional().default(0),
});

export const UpdateVideoProgressInputSchema = z.object({
  lastPositionSeconds: z.number().int().min(0).optional(),
  watchedSeconds: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().optional(),
});

export type CreateVideoProgressInputType = z.infer<typeof CreateVideoProgressInputSchema>;
export type UpdateVideoProgressInputType = z.infer<typeof UpdateVideoProgressInputSchema>;
