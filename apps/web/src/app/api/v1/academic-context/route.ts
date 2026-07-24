import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();

    const [yearsSnap, termsSnap] = await Promise.all([
      db.collection('academicYears').where('deletedAt', '==', null).where('isCurrent', '==', true).limit(1).get(),
      db.collection('academicTerms').where('deletedAt', '==', null).where('isActive', '==', true).orderBy('order', 'asc').get(),
    ]);

    let academicYear: { id: string; name: string } | null = null;
    if (!yearsSnap.empty) {
      const doc = yearsSnap.docs[0];
      const data = doc.data();
      academicYear = {
        id: doc.id,
        name: (data.nameAr as string) || (data.name as string) || '',
      };
    }

    let activeTerm: { id: string; name: string } | null = null;
    if (academicYear) {
      const termDocs = termsSnap.docs.filter((t) => {
        const tData = t.data();
        return (tData.academicYearId as string) === academicYear!.id;
      });
      if (termDocs.length > 0) {
        const termDoc = termDocs[0];
        const termData = termDoc.data();
        activeTerm = {
          id: termDoc.id,
          name: (termData.nameAr as string) || (termData.name as string) || '',
        };
      } else if (!termsSnap.empty) {
        const firstTerm = termsSnap.docs[0];
        const firstData = firstTerm.data();
        activeTerm = {
          id: firstTerm.id,
          name: (firstData.nameAr as string) || (firstData.name as string) || '',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        academicYear,
        term: activeTerm,
        termManagementMode: 'manual',
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
