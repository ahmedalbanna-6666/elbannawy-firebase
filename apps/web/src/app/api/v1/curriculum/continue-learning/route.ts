import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { UnitRepository, LessonRepository, LessonProgressRepository, type ILesson } from '@el-bannawy/lib';

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
      return NextResponse.json({ success: true, data: null });
    }

    const unitsResult = await unitRepository.getUnitsByTerm(termId);
    if (!unitsResult.ok || unitsResult.value.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const progressResult = await progressRepository.listStudentProgress(studentId);

    const completedLessonIds = new Set<string>();
    if (progressResult.ok) {
      for (const p of progressResult.value) {
        if (p.status === 'completed') {
          completedLessonIds.add(p.lessonId);
        }
      }
    }

    const unitIds = unitsResult.value.map((u) => u.id);
    const lessonsByUnitResult = await lessonRepository.getPublishedLessonsByUnitIds(unitIds);
    const lessonsByUnit = lessonsByUnitResult.ok ? lessonsByUnitResult.value! : new Map<string, ILesson[]>();

    for (const unit of unitsResult.value) {
      const unitLessons = lessonsByUnit.get(unit.id) ?? [];
      for (const lesson of unitLessons) {
        if (!completedLessonIds.has(lesson.id)) {
          return NextResponse.json({
            success: true,
            data: {
              unitId: unit.id,
              unitName: unit.name,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              lessonSlug: lesson.slug,
              displayOrder: lesson.displayOrder,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 },
    );
  }
}
