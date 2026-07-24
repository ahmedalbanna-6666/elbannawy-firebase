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

    if (!stagesResult.ok || !gradesResult.ok) {
      return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list stages' } }, { status: 500 });
    }

    const gradesByStage = new Map<string, { id: string; name: string; nameAr: string; displayOrder: number; _count: { users: number } }[]>();
    for (const g of gradesResult.value.items) {
      const stageId = g.stageId;
      if (!gradesByStage.has(stageId)) gradesByStage.set(stageId, []);
      gradesByStage.get(stageId)!.push({
        id: g.id,
        name: g.name,
        nameAr: g.nameAr,
        displayOrder: g.order,
        _count: { users: 0 },
      });
    }

    const stages = stagesResult.value.items.map((d) => ({
      id: d.id,
      name: d.name,
      nameAr: d.nameAr,
      educationalSystemId: d.educationalSystemId,
      order: d.order,
      isActive: d.isActive,
      grades: gradesByStage.get(d.id) ?? [],
    }));

    return NextResponse.json({ success: true, data: stages });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list stages' } }, { status: 500 });
  }
}
