import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/firebase/auth-helper';

const COLLECTION = 'academicTerms';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { id: academicYearId } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const docRef = db.collection(COLLECTION).doc();
    const termData = { ...body, id: docRef.id, academicYearId, order: (body as Record<string, unknown>).displayOrder ?? (body as Record<string, unknown>).order ?? 0, deletedAt: null, createdAt: now, updatedAt: now };
    delete (termData as Record<string, unknown>).displayOrder;
    await docRef.set(termData);
    const saved = await docRef.get();
    return NextResponse.json({ success: true, data: { id: docRef.id, ...saved.data() } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create term' } }, { status: 500 });
  }
}
