import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService } from '@el-bannawy/lib';
import { requireAdmin } from '@/lib/firebase/auth-helper';

const curriculumService = new CurriculumService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const [stagesResult, gradesResult] = await Promise.all([
      curriculumService.listStages({}, { limit: 100 }),
      curriculumService.listGrades({}, { limit: 100 }),
    ]);

    if (!stagesResult.ok) {
      return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list stages' } }, { status: 500 });
    }

    const gradesByStage = new Map<string, { id: string; name: string; displayOrder: number }[]>();
    if (gradesResult.ok) {
      for (const g of gradesResult.value.items) {
        const entry = gradesByStage.get(g.stageId) ?? [];
        entry.push({ id: g.id, name: g.nameAr, displayOrder: g.order });
        gradesByStage.set(g.stageId, entry);
      }
    }

    const stages = stagesResult.value.items.map((s) => ({
      id: s.id,
      name: s.nameAr,
      grades: gradesByStage.get(s.id) ?? [],
    }));

    return NextResponse.json({ success: true, data: stages });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list stages' } }, { status: 500 });
  }
}
