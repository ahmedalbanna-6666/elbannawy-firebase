import type {
  CreateVocabularySectionInput,
  CreateVocabularyItemInput,
  CreateVocabularyRelationInput,
} from '../../repositories/contracts';
import type {
  VocabularyStructuredDraft,
  VocabularyItemDraft,
  VocabularyStandardItemDraft,
  VocabularyRelationDraft,
} from './vocabulary-import.types';

function isStandardItem(item: VocabularyItemDraft): item is VocabularyStandardItemDraft {
  return item.kind === 'STANDARD_ITEM';
}

function isRelationItem(item: VocabularyItemDraft): item is VocabularyRelationDraft {
  return item.kind === 'SYNONYM_ANTONYM_RELATION';
}

export interface CommitVocabularySections {
  sections: CreateVocabularySectionInput[];
  items: CreateVocabularyItemInput[];
  relations: CreateVocabularyRelationInput[];
  clientDraftToSectionId: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Class convention matches LessonFirestoreMapper
export class VocabularyCommitMapper {
  static toCreateInputs(
    lessonId: string,
    draft: VocabularyStructuredDraft,
  ): CommitVocabularySections {
    const sections: CreateVocabularySectionInput[] = draft.sections.map(s => ({
      id: s.clientDraftId,
      lessonId,
      kind: s.kind,
      title: s.title,
      displayOrder: s.displayOrder,
      sourceTableIndex: s.sourceTableIndex,
      sourceTitleRowIndex: s.sourceTitleRowIndex,
    }));

    const clientDraftToSectionId: Record<string, string> = {};
    draft.sections.forEach(s => {
      clientDraftToSectionId[s.clientDraftId] = s.clientDraftId;
    });

    const items: CreateVocabularyItemInput[] = [];
    const relations: CreateVocabularyRelationInput[] = [];
    let relationOrder = 0;

    for (const item of draft.items) {
      if (isStandardItem(item)) {
        if (item.status === 'INVALID') continue;
        items.push({
          id: item.clientDraftId,
          lessonId,
          sectionId: item.sectionClientDraftId,
          word: item.word,
          pronunciation: '',
          translation: item.translation,
          definition: item.definition,
          example: item.example,
          partOfSpeech: item.partOfSpeech,
          displayOrder: item.displayOrder,
          sourceTableIndex: item.sourceTableIndex,
          sourceRowIndex: item.sourceRowIndex,
          sourcePairIndex: item.sourcePairIndex,
        });
      } else if (isRelationItem(item)) {
        if (item.status === 'INVALID') continue;

        items.push({
          id: item.clientDraftId,
          lessonId,
          sectionId: item.sectionClientDraftId,
          word: item.primaryWord,
          pronunciation: '',
          translation: item.primaryTranslation,
          definition: null,
          example: null,
          partOfSpeech: null,
          displayOrder: item.displayOrder,
          sourceTableIndex: item.sourceTableIndex,
          sourceRowIndex: item.sourceRowIndex,
        });

        if (item.synonym?.trim()) {
          const syns = item.synonym.split(',').map(s => s.trim()).filter(Boolean);
          for (const syn of syns) {
            const synId = 'rel-' + item.clientDraftId + '-syn-' + String(relationOrder);
            relations.push({
              id: synId,
              lessonId,
              sectionId: item.sectionClientDraftId,
              primaryItemId: item.clientDraftId,
              relationType: 'SYNONYM',
              relatedWord: syn,
              relatedTranslation: item.synonymTranslation,
              displayOrder: relationOrder,
              sourceTableIndex: item.sourceTableIndex,
              sourceRowIndex: item.sourceRowIndex,
            });
            relationOrder++;
          }
        }

        if (item.antonym?.trim()) {
          const ants = item.antonym.split(',').map(s => s.trim()).filter(Boolean);
          for (const ant of ants) {
            const id = 'rel-' + item.clientDraftId + '-ant-' + String(relationOrder);
            relations.push({
              id,
              lessonId,
              sectionId: item.sectionClientDraftId,
              primaryItemId: item.clientDraftId,
              relationType: 'ANTONYM',
              relatedWord: ant,
              relatedTranslation: item.antonymTranslation,
              displayOrder: relationOrder,
              sourceTableIndex: item.sourceTableIndex,
              sourceRowIndex: item.sourceRowIndex,
            });
            relationOrder++;
          }
        }
      }
    }

    return { sections, items, relations, clientDraftToSectionId };
  }
}
