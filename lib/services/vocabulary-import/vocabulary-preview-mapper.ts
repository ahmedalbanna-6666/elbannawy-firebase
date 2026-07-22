import { v4 as uuidv4 } from 'uuid';
import type { VocabularyDocument } from '../../vocabulary-import/types';
import type {
  VocabularyStructuredDraft,
  VocabularySectionDraft,
  VocabularyItemDraft,
  VocabularyPreviewCounts,
  PreviewResult,
  PreviewItem,
  PreviewGroupMeta,
} from './vocabulary-import.types';

function hasContent(value: string | string[]): boolean {
  if (Array.isArray(value)) return value.some(v => v.trim().length > 0);
  return value.trim().length > 0;
}

function flattenArabic(value: string | string[]): string {
  if (Array.isArray(value)) return value.join(' / ');
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Class convention matches LessonFirestoreMapper
export class VocabularyPreviewMapper {
  static toStructuredDraft(document: VocabularyDocument): VocabularyStructuredDraft {
    const sectionDrafts: VocabularySectionDraft[] = [];
    const itemDrafts: VocabularyItemDraft[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    let globalItemIndex = 0;

    for (let sIdx = 0; sIdx < document.sections.length; sIdx++) {
      const section = document.sections[sIdx];
      if (!section) continue;
      const sectionKind = section.type === 'synonym-antonym' ? 'SYNONYM_ANTONYM' : 'STANDARD_VOCABULARY';
      const sectionId = uuidv4();

      sectionDrafts.push({
        clientDraftId: sectionId,
        kind: sectionKind,
        title: section.heading || null,
        displayOrder: sIdx,
        sourceTableIndex: sIdx,
        sourceTitleRowIndex: null,
      });

      if (section.type === 'vocabulary') {
        for (let rowIdx = 0; rowIdx < section.items.length; rowIdx++) {
          const entry = section.items[rowIdx];
          if (!entry) continue;
          const itemWarnings: string[] = [];
          const itemErrors: string[] = [];

          if (!entry.english) {
            itemErrors.push('Missing English word');
          }
          if (!hasContent(entry.arabic)) {
            itemErrors.push('Missing Arabic translation');
          }

          const status = itemErrors.length > 0 ? 'INVALID' : itemWarnings.length > 0 ? 'WARNING' : 'VALID';

          itemDrafts.push({
            kind: 'STANDARD_ITEM',
            clientDraftId: uuidv4(),
            sectionClientDraftId: sectionId,
            word: entry.english,
            translation: flattenArabic(entry.arabic),
            definition: null,
            example: null,
            partOfSpeech: null,
            displayOrder: globalItemIndex,
            sourceTableIndex: sIdx,
            sourceRowIndex: rowIdx,
            sourcePairIndex: (rowIdx % 2) as 0 | 1,
            status,
            warnings: itemWarnings,
            errors: itemErrors,
          });
          globalItemIndex++;
        }
      } else {
        for (let rowIdx = 0; rowIdx < section.items.length; rowIdx++) {
          const entry = section.items[rowIdx];
          if (!entry) continue;
          const itemWarnings: string[] = [];
          const itemErrors: string[] = [];

          if (!entry.word) {
            itemErrors.push('Missing word');
          }
          if (!hasContent(entry.arabic)) {
            itemErrors.push('Missing Arabic translation');
          }

          const allSynonyms = entry.synonyms.filter(s => s.trim());
          const allAntonyms = entry.antonyms.filter(s => s.trim());

          if (allSynonyms.length === 0 && allAntonyms.length === 0) {
            itemWarnings.push('No synonyms or antonyms provided');
          }

          const status = itemErrors.length > 0 ? 'INVALID' : itemWarnings.length > 0 ? 'WARNING' : 'VALID';

          itemDrafts.push({
            kind: 'SYNONYM_ANTONYM_RELATION',
            clientDraftId: uuidv4(),
            sectionClientDraftId: sectionId,
            primaryWord: entry.word,
            primaryTranslation: flattenArabic(entry.arabic),
            synonym: allSynonyms.length > 0 ? allSynonyms.join(', ') : null,
            synonymTranslation: null,
            antonym: allAntonyms.length > 0 ? allAntonyms.join(', ') : null,
            antonymTranslation: null,
            displayOrder: globalItemIndex,
            sourceTableIndex: sIdx,
            sourceRowIndex: rowIdx,
            status,
            warnings: itemWarnings,
            errors: itemErrors,
          });
          globalItemIndex++;
        }
      }
    }

    const valid = itemDrafts.filter(i => i.status === 'VALID').length;
    const warning = itemDrafts.filter(i => i.status === 'WARNING').length;
    const invalid = itemDrafts.filter(i => i.status === 'INVALID').length;

    const counts: VocabularyPreviewCounts = {
      total: itemDrafts.length,
      valid,
      warning,
      invalid,
    };

    return {
      parserProfile: 'VOCABULARY_STRUCTURED_V2',
      sections: sectionDrafts,
      items: itemDrafts,
      counts,
      warnings,
      errors,
    };
  }

  static toPreviewResult(draft: VocabularyStructuredDraft): PreviewResult {
    const sections: PreviewGroupMeta[] = draft.sections.map(s => ({
      clientDraftId: s.clientDraftId,
      title: s.title,
      displayOrder: s.displayOrder,
    }));

    const items: PreviewItem[] = draft.items.map(item => {
      if (item.kind === 'STANDARD_ITEM') {
        return {
          clientDraftId: item.clientDraftId,
          kind: 'STANDARD_ITEM',
          word: item.word,
          translation: item.translation,
          partOfSpeech: item.partOfSpeech,
          synonym: null,
          synonymTranslation: null,
          antonym: null,
          antonymTranslation: null,
          status: item.status,
          warnings: item.warnings,
          errors: item.errors,
          sectionClientDraftId: item.sectionClientDraftId,
        };
      }
      return {
        clientDraftId: item.clientDraftId,
        kind: 'SYNONYM_ANTONYM_RELATION',
        word: item.primaryWord,
        translation: item.primaryTranslation,
        partOfSpeech: null,
        synonym: item.synonym,
        synonymTranslation: item.synonymTranslation,
        antonym: item.antonym,
        antonymTranslation: item.antonymTranslation,
        status: item.status,
        warnings: item.warnings,
        errors: item.errors,
        sectionClientDraftId: item.sectionClientDraftId,
      };
    });

    return {
      parserProfile: draft.parserProfile,
      counts: draft.counts,
      sections,
      items,
      warnings: draft.warnings,
      errors: draft.errors,
    };
  }
}
