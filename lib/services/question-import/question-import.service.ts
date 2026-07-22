import { importQuestionsFromDocx } from '../../question-import/docx-importer';
import { ActivityRepository } from '../../repositories/activities/activity.repository';
import { TransactionManager } from '../../repositories/transactions/transaction-manager';
import type { RepositoryResult } from '../../shared/types/repository.types';
import type { CreateActivityInput } from '../../repositories/contracts';
import type { ImportResult, ImportedActivity, ActivityContent } from '../../question-import/types';

export interface QuestionPreviewActivity {
  readonly order: number;
  readonly type: string;
  readonly title: string;
  readonly content: ActivityContent;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface QuestionPreviewResult {
  readonly documentTitle: string;
  readonly activities: readonly QuestionPreviewActivity[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface QuestionCommitResult {
  readonly lessonId: string;
  readonly activityCount: number;
  readonly activityIds: readonly string[];
}

export class QuestionImportService {
  private readonly activityRepo: ActivityRepository;
  private readonly transactionManager: TransactionManager;

  constructor() {
    this.activityRepo = new ActivityRepository();
    this.transactionManager = TransactionManager.getInstance();
  }

  async preview(filePath: string): Promise<RepositoryResult<QuestionPreviewResult>> {
    try {
      const result: ImportResult = await importQuestionsFromDocx({ filePath });
      const activities: QuestionPreviewActivity[] = result.activities.map(a => ({
        order: a.order,
        type: a.type,
        title: a.type + ' Activity #' + String(a.order),
        content: a.content,
        warnings: a.warnings.map(w => w.message),
        errors: a.errors.map(e => e.message),
      }));

      return {
        ok: true,
        value: {
          documentTitle: result.documentTitle,
          activities,
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message),
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { code: 'INTERNAL', message: msg, retryable: false, requestId: '' } };
    }
  }

  toActivityInputs(
    lessonId: string,
    activities: readonly ImportedActivity[],
  ): CreateActivityInput[] {
    return activities.filter(a => a.errors.length === 0).map(a => ({
      id: 'act-' + lessonId + '-' + String(a.order) + '-' + String(Date.now()),
      lessonId,
      type: a.type,
      title: a.type + ' Activity #' + String(a.order),
      displayOrder: a.order,
      config: {
        schemaVersion: 1,
        data: a.content,
      },
      status: 'draft',
      isRequired: true,
      isScorable: a.type !== 'WRITING',
      isPractice: false,
      retryable: false,
      prerequisiteActivityIds: [],
      metadata: {
        tags: [],
        aiGenerated: false,
      },
    }));
  }

  async commit(
    lessonId: string,
    activities: readonly ImportedActivity[],
  ): Promise<RepositoryResult<QuestionCommitResult>> {
      if (!lessonId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'lessonId is required', retryable: false, requestId: '' } };
    }

    const inputs = this.toActivityInputs(lessonId, activities);
    if (inputs.length === 0) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'No valid activities to commit', retryable: false, requestId: '' } };
    }

    try {
      const result = await this.transactionManager.runTransaction(async () => {
        const activityIds: string[] = [];
        for (const input of inputs) {
          const r = await this.activityRepo.createActivity(input);
          if (!r.ok) throw new Error(`Failed to create activity: ${r.error.message}`);
          activityIds.push(r.value.id);
        }
        return { lessonId, activityCount: activityIds.length, activityIds };
      });

      return { ok: true, value: result };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { code: 'INTERNAL', message: msg, retryable: false, requestId: '' } };
    }
  }
}
