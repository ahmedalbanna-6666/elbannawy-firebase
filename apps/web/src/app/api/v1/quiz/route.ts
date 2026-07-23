import { NextRequest, NextResponse } from 'next/server';
import { QuizService, CreateQuizInputSchema } from '@el-bannawy/lib';

const quizService = new QuizService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 }); }
  const parsed = CreateQuizInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: parsed.error.message } }, { status: 400 });
  try {
    const result = await quizService['quizRepo'].create(parsed.data);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) { return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 }); }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'id is required' } }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 }); }
  try {
    const result = await quizService['quizRepo'].update(id, body, 0);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) { return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 }); }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'id is required' } }, { status: 400 });
  try {
    const result = await quizService['quizRepo'].delete(id);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: null });
  } catch (error) { return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 }); }
}
