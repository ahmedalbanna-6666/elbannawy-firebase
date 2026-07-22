import type {
  Activity,
  ActivityManifest,
  ExecutionContext,
  StudentAttempt,
  ExecutionResult,
} from '../domain/activities';

export type { ActivityManifest } from '../domain/activities';

export type PluginType = 'activity';

export interface ActivityPlugin {
  readonly type: PluginType;
  readonly manifest: ActivityManifest;
  validate?(config: unknown): boolean;
  getInitialState?(context: ExecutionContext): unknown;
  render?(context: ExecutionContext): unknown;
  grade?(attempt: StudentAttempt, activity: Activity): {
    score: number;
    maxScore: number;
    feedback?: string;
    correctAnswer?: unknown;
  };
  getCorrectAnswer?(activity: Activity): unknown;
  execute?(context: ExecutionContext): Promise<Partial<ExecutionResult>>;
}

export interface PluginRegistration {
  plugin: ActivityPlugin;
  enabled: boolean;
  registeredAt: string;
}

export interface PluginValidator {
  type: string;
  validate(config: unknown): { valid: boolean; errors: string[] };
}

export interface ActivityRenderer {
  type: string;
  render(context: ExecutionContext): unknown;
}
