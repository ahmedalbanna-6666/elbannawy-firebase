import { NextRequest, NextResponse } from 'next/server';
import { VocabularyItemRepository } from '@el-bannawy/lib';

const itemRepo = new VocabularyItemRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vocabId: string }> },
): Promise<NextResponse> {
  const { vocabId } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
  }
  try {
    const result = await itemRepo.update(vocabId, body, 0);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; vocabId: string }> },
): Promise<NextResponse> {
  const { vocabId } = await params;
  try {
    const result = await itemRepo.deleteBySection(vocabId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
