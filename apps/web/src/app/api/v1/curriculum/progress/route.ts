import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { UnitRepository, LessonRepository, LessonProgressRepository } from '@el-bannawy/lib';

const unitRepository = new UnitRepository();
const lessonRepository = new LessonRepository();
const progressRepository = new LessonProgressRepository();

async function getStudentTermId(studentId: string): Promise<string | null> {
  const doc = await getAdminDb().collection('users').doc(studentId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return data?.termId ?? null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    const studentId = decoded.uid;

    const termId = await getStudentTermId(studentId);
    if (!termId) {
      return NextResponse.json({ success: true, data: { units: [], totalLessons: 0, completedLessons: 0, overallPercentage: 0 } });
    }

    const unitsResult = await unitRepository.getUnitsByTerm(termId);
    if (!unitsResult.ok) {
      return NextResponse.json({ success: false, error: unitsResult.error }, { status: 500 });
    }

    const progressResult = await progressRepository.listStudentProgress(studentId);
    const progressMap = new Map<string, string>();
    if (progressResult.ok) {
      for (const p of progressResult.value) {
        progressMap.set(p.lessonId, p.status);
      }
    }

    interface UnitProgressEntry {
      unitId: string;
      unitName: string;
      totalLessons: number;
      completedLessons: number;
      percentage: number;
    }

    const unitProgress: UnitProgressEntry[] = [];
    let totalLessons = 0;
    let completedLessons = 0;

    for (const unit of unitsResult.value) {
      const lessonsResult = await lessonRepository.getPublishedLessons(unit.id);
      if (!lessonsResult.ok) continue;

      const unitTotal = lessonsResult.value.length;
      let unitCompleted = 0;

      for (const lesson of lessonsResult.value) {
        totalLessons++;
        const status = progressMap.get(lesson.id);
        if (status === 'completed') {
          completedLessons++;
          unitCompleted++;
        }
      }

      unitProgress.push({
        unitId: unit.id,
        unitName: unit.name,
        totalLessons: unitTotal,
        completedLessons: unitCompleted,
        percentage: unitTotal > 0 ? Math.round((unitCompleted / unitTotal) * 100) : 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        units: unitProgress,
        totalLessons,
        completedLessons,
        overallPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 },
    );
  }
}
