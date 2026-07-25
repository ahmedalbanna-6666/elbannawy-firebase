import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let academicYear: { id: string; name: string } | null = null;
    let activeTerm: { id: string; name: string } | null = null;
    let termManagementMode = 'MANUAL';

    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const db = getAdminDb();
      const settingsSnap = await db.collection('systemSettings').doc('system-settings').get();

      if (settingsSnap.exists) {
        const settings = settingsSnap.data() as Record<string, unknown> | undefined;
        const activeAcademicYearId = settings?.activeAcademicYearId as string | undefined;
        const activeTermId = settings?.activeTermId as string | undefined;
        termManagementMode = (settings?.termManagementMode as string) ?? 'MANUAL';

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
      }
    } catch {
      // Firebase Admin unavailable - return empty context
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
      {
        success: false,
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    );
  }
}
