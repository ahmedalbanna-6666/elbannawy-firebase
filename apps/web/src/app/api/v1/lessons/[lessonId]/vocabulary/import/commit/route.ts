import { NextResponse, type NextRequest } from 'next/server';
import { VocabularyImportService, VocabularyPreviewMapper } from '@el-bannawy/lib';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  const { lessonId } = await params;
  try {
    const body: { draft?: unknown; items?: unknown[]; sections?: unknown[]; removeVocabIds?: string[] } = await request.json() as Record<string, unknown>;

    if (!body.draft) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'No draft provided. Call preview first.' } }, { status: 400 });
    }

    const draft = VocabularyPreviewMapper.toStructuredDraft(body.draft as Parameters<typeof VocabularyPreviewMapper.toStructuredDraft>[0]);
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
