import type { ExecutionResult, StudentAttempt, StudentAttemptSummary, LessonProgress } from '../../../domain/activities';

export interface ActivityOutput {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly instructions?: string;
  readonly displayOrder: number;
  readonly config: { readonly schemaVersion: number; readonly data: unknown };
  readonly status: string;
  readonly isRequired: boolean;
  readonly isScorable: boolean;
  readonly isPractice: boolean;
  readonly timeLimit?: number;
  readonly maxAttempts?: number;
  readonly retryable: boolean;
  readonly prerequisiteActivityIds: string[];
  readonly metadata: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags: string[];
    readonly bloomLevel?: string;
    readonly aiGenerated: boolean;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ActivitySummaryOutput {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly displayOrder: number;
  readonly status: string;
  readonly isRequired: boolean;
  readonly isScorable: boolean;
  readonly isPractice: boolean;
  readonly metadata: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags: string[];
    readonly aiGenerated: boolean;
  };
  readonly createdAt: string;
}

export interface CreateActivityRequest {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly instructions?: string;
  readonly displayOrder: number;
  readonly config: { readonly schemaVersion: number; readonly data: unknown };
  readonly isRequired?: boolean;
  readonly isScorable?: boolean;
  readonly isPractice?: boolean;
  readonly timeLimit?: number;
  readonly maxAttempts?: number;
  readonly retryable?: boolean;
  readonly prerequisiteActivityIds?: string[];
  readonly metadata?: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags?: string[];
    readonly bloomLevel?: string;
  };
}

export interface UpdateActivityRequest {
  readonly title?: string;
  readonly subtitle?: string;
  readonly instructions?: string;
  readonly displayOrder?: number;
  readonly config?: { readonly schemaVersion: number; readonly data: unknown };
  readonly isRequired?: boolean;
  readonly isScorable?: boolean;
  readonly isPractice?: boolean;
  readonly timeLimit?: number;
  readonly maxAttempts?: number;
  readonly retryable?: boolean;
  readonly prerequisiteActivityIds?: string[];
  readonly metadata?: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags?: string[];
    readonly bloomLevel?: string;
  };
}

export interface StartAttemptRequest {
  readonly studentId: string;
  readonly lessonId: string;
  readonly unitId: string;
}

export interface SubmitAttemptRequest {
  readonly answer: unknown;
  readonly timeSpent: number;
}

export interface ExecutionResponse {
  readonly success: boolean;
  readonly attempt: StudentAttempt;
  readonly progress?: LessonProgress;
  readonly score?: number;
  readonly maxScore?: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly feedback?: string;
}

export function toActivityOutput(entity: {
  id: string; lessonId: string; type: string; title: string; subtitle?: string;
  instructions?: string; displayOrder: number; config: { schemaVersion: number; data: unknown };
  status: string; isRequired: boolean; isScorable: boolean; isPractice: boolean;
  timeLimit?: number; maxAttempts?: number; retryable: boolean;
  prerequisiteActivityIds: string[];
  metadata: { estimatedDuration?: number; skill?: string; difficulty?: string; tags: string[]; bloomLevel?: string; aiGenerated: boolean };
  createdAt: string; updatedAt: string;
}): ActivityOutput {
  return { ...entity };
}

export function toActivitySummaryOutput(entity: {
  id: string; lessonId: string; type: string; title: string; subtitle?: string;
  displayOrder: number; status: string; isRequired: boolean; isScorable: boolean;
  isPractice: boolean;
  metadata: { estimatedDuration?: number; skill?: string; difficulty?: string; tags: string[]; aiGenerated: boolean };
  createdAt: string;
}): ActivitySummaryOutput {
  return { ...entity };
}

export function toAttemptOutput(attempt: StudentAttempt): StudentAttempt {
  return { ...attempt };
}

export function toAttemptSummaryOutput(summary: StudentAttemptSummary): StudentAttemptSummary {
  return { ...summary };
}

export function toProgressOutput(progress: LessonProgress): LessonProgress {
  return { ...progress };
}

export function toExecutionResponse(result: ExecutionResult): ExecutionResponse {
  return {
    success: result.success,
    attempt: { ...result.attempt },
    progress: result.progress ? { ...result.progress } : undefined,
    score: result.score,
    maxScore: result.maxScore,
    percentage: result.percentage,
    passed: result.passed,
    feedback: result.feedback,
  };
}
