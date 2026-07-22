import { IBaseEntity } from '../../../shared/types/repository.types';

export const ActivityStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus];

export const GradingMethod = {
  AUTO: 'auto',
  MANUAL: 'manual',
  AI_ASSISTED: 'ai_assisted',
  PRACTICE: 'practice',
} as const;

export type GradingMethod = (typeof GradingMethod)[keyof typeof GradingMethod];

export const AttemptStatus = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  EXPIRED: 'expired',
} as const;

export type AttemptStatus = (typeof AttemptStatus)[keyof typeof AttemptStatus];

export const LessonProgressStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type LessonProgressStatus = (typeof LessonProgressStatus)[keyof typeof LessonProgressStatus];

export interface Activity extends IBaseEntity {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly instructions?: string;
  readonly displayOrder: number;
  readonly config: {
    readonly schemaVersion: number;
    readonly data: unknown;
  };
  readonly status: ActivityStatus;
  readonly isRequired: boolean;
  readonly isScorable: boolean;
  readonly isPractice: boolean;
  readonly timeLimit?: number;
  readonly maxAttempts?: number;
  readonly retryable: boolean;
  readonly prerequisiteActivityIds: string[];
  readonly metadata: ActivityMetadata;
}

export interface ActivitySummary {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly displayOrder: number;
  readonly status: ActivityStatus;
  readonly isRequired: boolean;
  readonly isScorable: boolean;
  readonly isPractice: boolean;
  readonly metadata: ActivityMetadata;
  readonly createdAt: string;
}

export interface ActivityMetadata {
  readonly estimatedDuration?: number;
  readonly skill?: string;
  readonly difficulty?: string;
  readonly tags: string[];
  readonly bloomLevel?: string;
  readonly aiGenerated: boolean;
}

export interface ActivityManifest {
  readonly type: string;
  readonly version: number;
  readonly displayName: string;
  readonly description: string;
  readonly category: string;
  readonly renderer: string;
  readonly validator: string;
  readonly scorer: string;
  readonly migration?: string;
  readonly capabilities: {
    readonly timed: boolean;
    readonly aiSupported: boolean;
    readonly retryable: boolean;
    readonly partialCredit: boolean;
    readonly attachments: boolean;
    readonly shuffle: boolean;
    readonly reviewable: boolean;
  };
}

export interface ExecutionContext {
  readonly activity: Activity;
  readonly manifest: ActivityManifest;
  readonly attempt?: StudentAttempt;
  readonly mode: 'view' | 'practice' | 'graded' | 'review';
  readonly permissions: ExecutionPermissions;
  readonly settings: ExecutionSettings;
}

export interface ExecutionPermissions {
  readonly canAttempt: boolean;
  readonly canRetry: boolean;
  readonly canReview: boolean;
  readonly canSkip: boolean;
}

export interface ExecutionSettings {
  readonly locale: string;
  readonly direction: 'ltr' | 'rtl';
  readonly showFeedback: boolean;
  readonly showCorrectAnswer: boolean;
  readonly timeLimit?: number;
}

export interface StudentAttempt {
  readonly id: string;
  readonly activityId: string;
  readonly studentId: string;
  readonly lessonId: string;
  readonly unitId: string;
  readonly attemptNumber: number;
  readonly answer?: unknown;
  readonly score?: number;
  readonly maxScore: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly feedback?: string;
  readonly correctAnswer?: unknown;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly timeLimit?: number;
  readonly timeSpent?: number;
  readonly status: AttemptStatus;
  readonly gradingMethod: GradingMethod;
  readonly state?: unknown;
  readonly activitySchemaVersion: number;
  readonly metadata: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly deviceType?: string;
    readonly submittedFrom?: string;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StudentAttemptSummary {
  readonly id: string;
  readonly activityId: string;
  readonly studentId: string;
  readonly attemptNumber: number;
  readonly score?: number;
  readonly maxScore: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly status: AttemptStatus;
  readonly gradingMethod: GradingMethod;
  readonly submittedAt?: string;
  readonly timeSpent?: number;
}

export interface LessonProgress {
  readonly id: string;
  readonly studentId: string;
  readonly lessonId: string;
  readonly unitId: string;
  readonly status: LessonProgressStatus;
  readonly completedActivities: number;
  readonly totalActivities: number;
  readonly percentage: number;
  readonly score?: number;
  readonly maxScore?: number;
  readonly lastActivityId?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProgressEvent {
  readonly type: 'activity_started' | 'activity_progress' | 'activity_completed' | 'activity_failed';
  readonly activityId: string;
  readonly studentId: string;
  readonly lessonId: string;
  readonly score?: number;
  readonly maxScore?: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly timestamp: string;
}

export interface ExecutionResult {
  readonly success: boolean;
  readonly attempt: StudentAttempt;
  readonly progress?: LessonProgress;
  readonly score?: number;
  readonly maxScore?: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly feedback?: string;
  readonly correctAnswer?: unknown;
  readonly events: ProgressEvent[];
}
