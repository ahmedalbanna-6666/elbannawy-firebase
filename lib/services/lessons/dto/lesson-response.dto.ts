export interface LessonOutput {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status: string;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LessonSummaryOutput {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly displayOrder: number;
  readonly status: string;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
}

export interface LessonListOutput<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
