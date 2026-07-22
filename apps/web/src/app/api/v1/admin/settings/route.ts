import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

const SETTINGS_DOC = 'system-settings';

export async function GET(): Promise<NextResponse> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('systemSettings').doc(SETTINGS_DOC).get();
    if (!doc.exists) {
      return NextResponse.json({ success: true, data: { termManagementMode: 'MANUAL', activeAcademicYearId: null, activeTermId: null, autoDateRanges: false } });
    }
    return NextResponse.json({ success: true, data: doc.data() });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch settings' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    await db.collection('systemSettings').doc(SETTINGS_DOC).set(body, { merge: true });
    return NextResponse.json({ success: true, data: body });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update settings' } }, { status: 500 });
  }
}
