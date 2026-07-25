import { NextRequest, NextResponse } from 'next/server';
import { LessonDocumentRepository, UpdateLessonDocumentInputSchema } from '@el-bannawy/lib';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

const documentRepository = new LessonDocumentRepository();

async function requireAuth(request: NextRequest): Promise<{ uid: string } | { response: NextResponse }> {
  const decoded = await authenticateRequest(request);
  if (!decoded) {
    return { response: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 }) };
  }
  return { uid: decoded.uid };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  try {
    const result = await documentRepository.getByLessonId(id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 500 },
      );
    }
    if (!result.value) {
      return NextResponse.json(
        { success: true, data: null },
      );
    }
    return NextResponse.json(
      { success: true, data: result.value, timestamp: new Date().toISOString() },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  try {
    const result = await documentRepository.delete(id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, data: null, timestamp: new Date().toISOString() },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const parsed = UpdateLessonDocumentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.message }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  try {
    const result = await documentRepository.update(id, parsed.data, 0);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, data: result.value, timestamp: new Date().toISOString() },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
