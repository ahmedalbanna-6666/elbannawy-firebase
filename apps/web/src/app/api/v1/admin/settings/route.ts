import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/firebase/auth-helper';

const SETTINGS_DOC = 'system-settings';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const db = getAdminDb();
    const doc = await db.collection('systemSettings').doc(SETTINGS_DOC).get();
    if (!doc.exists) {
      return NextResponse.json({ success: true, data: { termManagementMode: 'MANUAL', activeAcademicYearId: null, activeTermId: null, autoDateRanges: false } });
    }
    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to fetch settings' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    await db.collection('systemSettings').doc(SETTINGS_DOC).set(body, { merge: true });
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to update settings' } }, { status: 500 });
  }
}
