import { z } from 'zod';

export const VideoProviderEnum = z.enum(['youtube', 'vimeo', 'other']);

export const CreateLessonVideoInputSchema = z.object({
  id: z.string().min(1).max(128),
  lessonId: z.string().min(1).max(128),
  title: z.string().min(1).max(500),
  provider: VideoProviderEnum,
  providerVideoId: z.string().min(1).max(500),
  providerUrl: z.string().url().max(1000),
  durationSeconds: z.number().int().min(0),
  thumbnailUrl: z.string().url().max(1000).optional(),
  displayOrder: z.number().int().min(0),
  enabled: z.boolean().optional().default(true),
  interactiveTimelineEnabled: z.boolean().optional().default(false),
});

export const UpdateLessonVideoInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  provider: VideoProviderEnum.optional(),
  providerVideoId: z.string().min(1).max(500).optional(),
  providerUrl: z.string().url().max(1000).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  thumbnailUrl: z.string().url().max(1000).optional(),
  displayOrder: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
  interactiveTimelineEnabled: z.boolean().optional(),
});

export const LessonVideoFilterSchema = z.object({
  lessonId: z.string().max(128).optional(),
  enabled: z.boolean().optional(),
});

export const LessonVideoIdSchema = z.string().min(1).max(128);

export type CreateLessonVideoInputType = z.infer<typeof CreateLessonVideoInputSchema>;
export type UpdateLessonVideoInputType = z.infer<typeof UpdateLessonVideoInputSchema>;
export type LessonVideoFilterType = z.infer<typeof LessonVideoFilterSchema>;
