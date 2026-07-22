import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { IActivity, IActivitySummary, CreateActivityInput, IActivityStatus } from '../contracts';

export interface ActivityFirestoreDoc {
  id: string;
  lessonId: string;
  type: string;
  title: string;
  subtitle?: string | null;
  instructions?: string | null;
  displayOrder: number;
  config: { schemaVersion: number; data: unknown };
  status: string;
  isRequired: boolean;
  isScorable: boolean;
  isPractice: boolean;
  timeLimit?: number | null;
  maxAttempts?: number | null;
  retryable: boolean;
  prerequisiteActivityIds: string[];
  metadata: {
    estimatedDuration?: number | null;
    skill?: string | null;
    difficulty?: string | null;
    tags: string[];
    bloomLevel?: string | null;
    aiGenerated: boolean;
  };
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
  deletedAt?: Timestamp | string | null;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Class convention matches LessonFirestoreMapper
export class ActivityFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: ActivityFirestoreDoc): IActivity {
    return {
      id: doc.id,
      lessonId: doc.lessonId,
      type: doc.type,
      title: doc.title,
      subtitle: doc.subtitle ?? undefined,
      instructions: doc.instructions ?? undefined,
      displayOrder: doc.displayOrder,
      config: {
        schemaVersion: doc.config.schemaVersion,
        data: doc.config.data,
      },
      status: doc.status as IActivityStatus,
      isRequired: doc.isRequired,
      isScorable: doc.isScorable,
      isPractice: doc.isPractice,
      timeLimit: doc.timeLimit ?? undefined,
      maxAttempts: doc.maxAttempts ?? undefined,
      retryable: doc.retryable,
      prerequisiteActivityIds: doc.prerequisiteActivityIds,
      metadata: {
        estimatedDuration: doc.metadata.estimatedDuration ?? undefined,
        skill: doc.metadata.skill ?? undefined,
        difficulty: doc.metadata.difficulty ?? undefined,
        tags: doc.metadata.tags,
        bloomLevel: doc.metadata.bloomLevel ?? undefined,
        aiGenerated: doc.metadata.aiGenerated,
      },
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? formatFirestoreTimestamp(doc.deletedAt) : null,
    };
  }

  static toSummary(doc: ActivityFirestoreDoc): IActivitySummary {
    return {
      id: doc.id,
      lessonId: doc.lessonId,
      type: doc.type,
      title: doc.title,
      subtitle: doc.subtitle ?? undefined,
      displayOrder: doc.displayOrder,
      status: doc.status as IActivityStatus,
      isRequired: doc.isRequired,
      isScorable: doc.isScorable,
      isPractice: doc.isPractice,
      metadata: {
        estimatedDuration: doc.metadata.estimatedDuration ?? undefined,
        skill: doc.metadata.skill ?? undefined,
        difficulty: doc.metadata.difficulty ?? undefined,
        tags: doc.metadata.tags,
        aiGenerated: doc.metadata.aiGenerated,
      },
      createdAt: formatFirestoreTimestamp(doc.createdAt),
    };
  }

  static toCreate(input: CreateActivityInput): ActivityFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id,
      lessonId: input.lessonId,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle ?? null,
      instructions: input.instructions ?? null,
      displayOrder: input.displayOrder,
      config: input.config,
      status: input.status ?? 'draft',
      isRequired: input.isRequired ?? true,
      isScorable: input.isScorable ?? true,
      isPractice: input.isPractice ?? false,
      timeLimit: input.timeLimit ?? null,
      maxAttempts: input.maxAttempts ?? null,
      retryable: input.retryable ?? false,
      prerequisiteActivityIds: input.prerequisiteActivityIds ?? [],
      metadata: {
        estimatedDuration: input.metadata?.estimatedDuration ?? null,
        skill: input.metadata?.skill ?? null,
        difficulty: input.metadata?.difficulty ?? null,
        tags: input.metadata?.tags ?? [],
        bloomLevel: input.metadata?.bloomLevel ?? null,
        aiGenerated: input.metadata?.aiGenerated ?? false,
      },
      createdAt: now,
      updatedAt: now,
      schemaVersion: ActivityFirestoreMapper.SCHEMA_VERSION,
      deletedAt: null,
    };
  }
}
