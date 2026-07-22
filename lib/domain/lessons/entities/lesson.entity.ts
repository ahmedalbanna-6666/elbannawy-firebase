import { IBaseEntity } from '../../../shared/types/repository.types';

export const LessonStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type LessonStatus = (typeof LessonStatus)[keyof typeof LessonStatus];

export interface Lesson extends IBaseEntity {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
}

export interface LessonSummary {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
}
