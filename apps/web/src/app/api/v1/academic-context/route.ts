import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

const SETTINGS_DOC = 'system-settings';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();

    const settingsSnap = await db.collection('systemSettings').doc(SETTINGS_DOC).get();
    const settings = settingsSnap.exists ? settingsSnap.data() : null;
    const activeAcademicYearId = settings?.activeAcademicYearId as string | undefined;
    const activeTermId = settings?.activeTermId as string | undefined;
    const termManagementMode = (settings?.termManagementMode as string) ?? 'MANUAL';

    let academicYear: { id: string; name: string } | null = null;
    let activeTerm: { id: string; name: string } | null = null;

    if (activeAcademicYearId) {
      const yearDoc = await db.collection('academicYears').doc(activeAcademicYearId).get();
      if (yearDoc.exists) {
        const data = yearDoc.data()!;
        academicYear = {
          id: yearDoc.id,
          name: (data.nameAr as string) || (data.name as string) || '',
        };
      }
    }

    if (activeTermId) {
      const termDoc = await db.collection('academicTerms').doc(activeTermId).get();
      if (termDoc.exists) {
        const data = termDoc.data()!;
        activeTerm = {
          id: termDoc.id,
          name: (data.nameAr as string) || (data.name as string) || '',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        academicYear,
        term: activeTerm,
        termManagementMode,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 },
    );
  }
}
