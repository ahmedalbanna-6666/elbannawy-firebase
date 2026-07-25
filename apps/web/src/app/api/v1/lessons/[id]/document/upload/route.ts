import { NextRequest, NextResponse } from 'next/server';
import { LessonDocumentRepository, CreateLessonDocumentInputSchema } from '@el-bannawy/lib';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

const documentRepository = new LessonDocumentRepository();

async function requireAuth(request: NextRequest): Promise<{ uid: string } | { response: NextResponse }> {
  const decoded = await authenticateRequest(request);
  if (!decoded) {
    return { response: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 }) };
  }
  return { uid: decoded.uid };
}

export async function POST(
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

  const uploadId = `doc_${id}_${Date.now()}`;
  const parsed = CreateLessonDocumentInputSchema.safeParse({
    id: uploadId,
    lessonId: id,
    storagePath: body.storagePath ?? '',
    fileName: body.fileName ?? '',
    mimeType: body.mimeType ?? '',
    fileSizeBytes: body.fileSizeBytes ?? 0,
    sha256: body.sha256 ?? '',
    processingStatus: 'completed',
    downloadable: false,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.message }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  try {
    const existing = await documentRepository.getByLessonId(id);
    if (existing.ok && existing.value) {
      await documentRepository.delete(id);
    }

    const result = await documentRepository.create(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: true, data: result.value, timestamp: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
