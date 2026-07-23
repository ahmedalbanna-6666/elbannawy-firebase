import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CurriculumService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();

    const [studentsSnap, teachersSnap, systemsResult, stagesResult, gradesResult, yearsResult] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get().catch(() => null),
      db.collection('users').where('role', '==', 'teacher').get().catch(() => null),
      curriculumService.listEducationalSystems({}, { limit: 1 }).catch(() => null),
      curriculumService.listStages({}, { limit: 1 }).catch(() => null),
      curriculumService.listGrades({}, { limit: 1 }).catch(() => null),
      curriculumService.listAcademicYears({}, { limit: 1 }).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        studentsCount: studentsSnap ? studentsSnap.docs.filter(d => !d.data().deletedAt).length : 0,
        teachersCount: teachersSnap ? teachersSnap.docs.filter(d => !d.data().deletedAt).length : 0,
        systemsCount: systemsResult?.ok ? systemsResult.value.items.length : 0,
        stagesCount: stagesResult?.ok ? stagesResult.value.items.length : 0,
        gradesCount: gradesResult?.ok ? gradesResult.value.items.length : 0,
        academicYearsCount: yearsResult?.ok ? yearsResult.value.items.length : 0,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch dashboard stats' } }, { status: 500 });
  }
}
