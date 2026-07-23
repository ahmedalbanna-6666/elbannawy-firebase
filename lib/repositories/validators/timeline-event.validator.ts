import { z } from 'zod';

export const TimelineEventTypeEnum = z.enum(['ACTIVITY', 'QUESTION', 'NOTE', 'QUIZ']);

export const CreateTimelineEventInputSchema = z.object({
  id: z.string().min(1).max(128),
  videoId: z.string().min(1).max(128),
  lessonId: z.string().min(1).max(128),
  activityId: z.string().min(1).max(128),
  timestampSeconds: z.number().int().min(0),
  eventType: TimelineEventTypeEnum,
  required: z.boolean().optional().default(true),
  enabled: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0),
});

export const UpdateTimelineEventInputSchema = z.object({
  timestampSeconds: z.number().int().min(0).optional(),
  eventType: TimelineEventTypeEnum.optional(),
  required: z.boolean().optional(),
  enabled: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export type CreateTimelineEventInputType = z.infer<typeof CreateTimelineEventInputSchema>;
export type UpdateTimelineEventInputType = z.infer<typeof UpdateTimelineEventInputSchema>;

export const TimelineEventProgressInputSchema = z.object({
  id: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  videoId: z.string().min(1).max(128),
  lessonId: z.string().min(1).max(128),
  timelineEventId: z.string().min(1).max(128),
  activityId: z.string().min(1).max(128),
});
