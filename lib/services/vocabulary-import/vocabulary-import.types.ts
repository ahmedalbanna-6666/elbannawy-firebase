import type { VocabularySectionKind } from '../../repositories/contracts';

export type VocabularyPreviewStatus = 'VALID' | 'WARNING' | 'INVALID';

export interface VocabularyPreviewCounts {
  readonly total: number;
  readonly valid: number;
  readonly warning: number;
  readonly invalid: number;
}

export interface VocabularySectionDraft {
  readonly clientDraftId: string;
  readonly kind: VocabularySectionKind;
  readonly title: string | null;
  readonly displayOrder: number;
  readonly sourceTableIndex: number;
  readonly sourceTitleRowIndex: number | null;
}

export interface VocabularyStandardItemDraft {
  readonly kind: 'STANDARD_ITEM';
  readonly clientDraftId: string;
  readonly sectionClientDraftId: string;
  readonly word: string;
  readonly translation: string;
  readonly definition: string | null;
  readonly example: string | null;
  readonly partOfSpeech: string | null;
  readonly displayOrder: number;
  readonly sourceTableIndex: number;
  readonly sourceRowIndex: number;
  readonly sourcePairIndex: 0 | 1;
  readonly status: VocabularyPreviewStatus;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface VocabularyRelationDraft {
  readonly kind: 'SYNONYM_ANTONYM_RELATION';
  readonly clientDraftId: string;
  readonly sectionClientDraftId: string;
  readonly primaryWord: string;
  readonly primaryTranslation: string;
  readonly synonym: string | null;
  readonly synonymTranslation: string | null;
  readonly antonym: string | null;
  readonly antonymTranslation: string | null;
  readonly displayOrder: number;
  readonly sourceTableIndex: number;
  readonly sourceRowIndex: number;
  readonly status: VocabularyPreviewStatus;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export type VocabularyItemDraft = VocabularyStandardItemDraft | VocabularyRelationDraft;

export interface VocabularyStructuredDraft {
  readonly parserProfile: 'VOCABULARY_STRUCTURED_V2';
  readonly sections: readonly VocabularySectionDraft[];
  readonly items: readonly VocabularyItemDraft[];
  readonly counts: VocabularyPreviewCounts;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface PreviewGroupMeta {
  readonly clientDraftId: string;
  readonly title: string | null;
  readonly displayOrder: number;
}

export interface PreviewItem {
  readonly clientDraftId: string;
  readonly kind: 'STANDARD_ITEM' | 'SYNONYM_ANTONYM_RELATION';
  readonly word: string;
  readonly translation: string;
  readonly partOfSpeech: string | null;
  readonly synonym: string | null;
  readonly synonymTranslation: string | null;
  readonly antonym: string | null;
  readonly antonymTranslation: string | null;
  readonly status: VocabularyPreviewStatus;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly sectionClientDraftId: string | null;
}

export interface PreviewResult {
  readonly parserProfile: string;
  readonly counts: VocabularyPreviewCounts;
  readonly sections: readonly PreviewGroupMeta[];
  readonly items: readonly PreviewItem[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface CommitVocabularyItemDto {
  readonly word: string;
  readonly translation: string;
  readonly definition?: string;
  readonly example?: string;
  readonly displayOrder?: number;
  readonly replaceVocabId?: string;
  readonly partOfSpeech?: string;
  readonly kind?: string;
  readonly synonym?: string;
  readonly synonymTranslation?: string;
  readonly antonym?: string;
  readonly antonymTranslation?: string;
  readonly sectionClientDraftId?: string;
}

export interface CommitVocabularySectionDto {
  readonly clientDraftId?: string;
  readonly title?: string;
  readonly displayOrder?: number;
  readonly kind?: string;
}

export interface CommitVocabularyImportDto {
  readonly items: CommitVocabularyItemDto[];
  readonly sections?: CommitVocabularySectionDto[];
  readonly removeVocabIds?: string[];
}

export interface StructuredVocabularyPersistenceResult {
  readonly lessonId: string;
  readonly sectionCount: number;
  readonly standardItemCount: number;
  readonly relationCount: number;
}
