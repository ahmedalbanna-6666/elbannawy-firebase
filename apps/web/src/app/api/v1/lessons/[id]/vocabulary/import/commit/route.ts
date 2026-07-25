import { NextResponse, type NextRequest } from 'next/server';
import { VocabularyImportService, type VocabularyStructuredDraft, type VocabularySectionDraft, type VocabularyItemDraft } from '@el-bannawy/lib';
import { getAdminDb } from '@/lib/firebase/admin';
import { randomUUID } from 'node:crypto';

interface FrontendItem {
  word: string;
  translation: string;
  definition?: string;
  example?: string;
  partOfSpeech?: string;
  kind: string;
  synonym?: string;
  synonymTranslation?: string;
  antonym?: string;
  antonymTranslation?: string;
  displayOrder: number;
  sectionClientDraftId: string | null;
  clientDraftId?: string;
}

interface FrontendSection {
  clientDraftId: string;
  title: string | null;
  displayOrder: number;
  kind?: string;
}

function buildDraftFromPayload(items: FrontendItem[], sections: FrontendSection[]): VocabularyStructuredDraft {
  const sectionDrafts: VocabularySectionDraft[] = sections.map((s) => ({
    clientDraftId: s.clientDraftId,
    kind: s.kind === 'SYNONYM_ANTONYM' ? 'SYNONYM_ANTONYM' : 'STANDARD_VOCABULARY',
    title: s.title ?? null,
    displayOrder: s.displayOrder,
    sourceTableIndex: 0,
    sourceTitleRowIndex: null,
  }));

  const itemDrafts: VocabularyItemDraft[] = items.map((item) => {
    const base = {
      clientDraftId: item.clientDraftId ?? randomUUID(),
      sectionClientDraftId: item.sectionClientDraftId ?? '',
      displayOrder: item.displayOrder,
      sourceTableIndex: 0,
      sourceRowIndex: 0,
      status: 'VALID' as const,
      warnings: [] as readonly string[],
      errors: [] as readonly string[],
    };

    if (item.kind === 'SYNONYM_ANTONYM_RELATION') {
      return {
        ...base,
        kind: 'SYNONYM_ANTONYM_RELATION' as const,
        primaryWord: item.word,
        primaryTranslation: item.translation,
        synonym: item.synonym ?? null,
        synonymTranslation: item.synonymTranslation ?? null,
        antonym: item.antonym ?? null,
        antonymTranslation: item.antonymTranslation ?? null,
      };
    }

    return {
      ...base,
      kind: 'STANDARD_ITEM' as const,
      word: item.word,
      translation: item.translation,
      definition: item.definition ?? null,
      example: item.example ?? null,
      partOfSpeech: item.partOfSpeech ?? null,
      sourcePairIndex: 0 as const,
    };
  });

  return {
    parserProfile: 'VOCABULARY_STRUCTURED_V2',
    sections: sectionDrafts,
    items: itemDrafts,
    counts: { total: itemDrafts.length, valid: itemDrafts.length, warning: 0, invalid: 0 },
    warnings: [],
    errors: [],
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const lessonId = (await params).id;
  try {
    const body: { items?: FrontendItem[]; sections?: FrontendSection[]; removeVocabIds?: string[] } = await request.json() as Record<string, unknown>;

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'No items provided' } }, { status: 400 });
    }

    // Delete replaced items before inserting new ones
    if (Array.isArray(body.removeVocabIds) && body.removeVocabIds.length > 0) {
      try {
        const db = getAdminDb();
        const batch = db.batch();
        for (const id of body.removeVocabIds) {
          const ref = db.collection('vocabularyItems').doc(id);
          batch.delete(ref);
        }
        await batch.commit();
      } catch {
        // Non-blocking: old items remain if deletion fails
      }
    }

    const draft = buildDraftFromPayload(body.items, body.sections ?? []);
    const service = new VocabularyImportService();
    const result = await service.commit(lessonId, draft);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Commit failed' } }, { status: 500 });
  }
}
