import { parseVocabularyDoc } from '../../vocabulary-import/parser';
import { VocabularyPreviewMapper } from './vocabulary-preview-mapper';
import { VocabularyCommitMapper } from './vocabulary-commit-mapper';
import { TransactionManager } from '../../repositories/transactions/transaction-manager';
import { VocabularySectionRepository } from '../../repositories/vocabulary/vocabulary-section.repository';
import { VocabularyItemRepository } from '../../repositories/vocabulary/vocabulary-item.repository';
import { VocabularyRelationRepository } from '../../repositories/vocabulary/vocabulary-relation.repository';
import type { RepositoryResult } from '../../shared/types/repository.types';
import type {
  VocabularyStructuredDraft,
  PreviewResult,
  CommitVocabularyImportDto,
  StructuredVocabularyPersistenceResult,
} from './vocabulary-import.types';

export interface VocabularyImportServiceConfig {
  pythonPath?: string;
}

export class VocabularyImportService {
  private readonly sectionRepo: VocabularySectionRepository;
  private readonly itemRepo: VocabularyItemRepository;
  private readonly relationRepo: VocabularyRelationRepository;
  private readonly transactionManager: TransactionManager;
  private readonly config: VocabularyImportServiceConfig;

  constructor(
    config: VocabularyImportServiceConfig = {},
  ) {
    this.sectionRepo = new VocabularySectionRepository();
    this.itemRepo = new VocabularyItemRepository();
    this.relationRepo = new VocabularyRelationRepository();
    this.transactionManager = TransactionManager.getInstance();
    this.config = config;
  }

  async preview(filePath: string): Promise<RepositoryResult<VocabularyStructuredDraft>> {
    try {
      const doc = await parseVocabularyDoc({ filePath, pythonPath: this.config.pythonPath });
      const draft = VocabularyPreviewMapper.toStructuredDraft(doc);
      return { ok: true, value: draft };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { code: 'INTERNAL', message: msg, retryable: false, requestId: '' } };
    }
  }

  async previewAsResult(filePath: string): Promise<RepositoryResult<PreviewResult>> {
    const result = await this.preview(filePath);
    if (!result.ok) return result;
    return { ok: true, value: VocabularyPreviewMapper.toPreviewResult(result.value) };
  }

  async commit(
    lessonId: string,
    draft: VocabularyStructuredDraft,
  ): Promise<RepositoryResult<StructuredVocabularyPersistenceResult>> {
    if (!lessonId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'lessonId is required', retryable: false, requestId: '' } };
    }

    const commitInputs = VocabularyCommitMapper.toCreateInputs(lessonId, draft);

    const invalidItems = draft.items.filter(i => i.status === 'INVALID');
    if (invalidItems.length > 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: String(invalidItems.length) + ' item(s) have INVALID status and cannot be committed',
          retryable: false,
          requestId: '',
        },
      };
    }

    try {
      const result = await this.transactionManager.runTransaction(async () => {
        const sectionIds: string[] = [];
        for (const section of commitInputs.sections) {
          const r = await this.sectionRepo.create(section);
          if (!r.ok) throw new Error(`Failed to create section: ${r.error.message}`);
          sectionIds.push(r.value.id);
        }

        const itemIds: string[] = [];
        for (const item of commitInputs.items) {
          const r = await this.itemRepo.create(item);
          if (!r.ok) throw new Error(`Failed to create item: ${r.error.message}`);
          itemIds.push(r.value.id);
        }

        const relationIds: string[] = [];
        for (const relation of commitInputs.relations) {
          const r = await this.relationRepo.create(relation);
          if (!r.ok) throw new Error(`Failed to create relation: ${r.error.message}`);
          relationIds.push(r.value.id);
        }

        return {
          lessonId,
          sectionCount: sectionIds.length,
          standardItemCount: commitInputs.items.filter(i => !i.id.startsWith('rel-')).length,
          relationCount: commitInputs.relations.length,
        };
      });

      return { ok: true, value: result };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { code: 'INTERNAL', message: msg, retryable: false, requestId: '' } };
    }
  }

  async commitFromDto(
    lessonId: string,
    _dto: CommitVocabularyImportDto,
    draft: VocabularyStructuredDraft,
  ): Promise<RepositoryResult<StructuredVocabularyPersistenceResult>> {
    return this.commit(lessonId, draft);
  }
}
