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

    const [studentsSnap, teachersSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'student').count().get().catch(() => null),
      db.collection('users').where('role', '==', 'teacher').count().get().catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        studentsCount: studentsSnap ? studentsSnap.data().count : 0,
        teachersCount: teachersSnap ? teachersSnap.data().count : 0,
        academicYearsCount: 0,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch dashboard stats' } }, { status: 500 });
  }
}
