import { NextRequest, NextResponse } from 'next/server';
import { VocabularyItemRepository } from '@el-bannawy/lib';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

const itemRepo = new VocabularyItemRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
  const lessonId = (await params).id;
  try {
    const result = await itemRepo.listByLesson(lessonId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    const items = (result.value ?? []).map(item => ({
      id: item.id,
      word: item.word,
      translation: item.translation,
      definition: item.definition,
      example: item.example,
      partOfSpeech: item.partOfSpeech,
      displayOrder: item.displayOrder,
    }));
    const groups = items.length > 0
      ? [{ id: null, title: 'Lesson Vocabulary', displayOrder: 0, items }]
      : [];
    return NextResponse.json({ success: true, data: { groups } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const lessonId = (await params).id;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
  }
  try {
    const input = {
      id: 'voc-' + lessonId + '-' + String(Date.now()),
      lessonId,
      sectionId: (body.sectionId as string) ?? null,
      word: body.word as string,
      pronunciation: (body.pronunciation as string) ?? '',
      translation: body.translation as string,
      definition: (body.definition as string) ?? null,
      example: (body.example as string) ?? null,
      partOfSpeech: (body.partOfSpeech as string) ?? null,
      displayOrder: (body.displayOrder as number) ?? 0,
    };
    const result = await itemRepo.create(input);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const lessonId = (await params).id;
  try {
    const result = await itemRepo.deleteByLesson(lessonId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
