import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService, CurriculumApplicationService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();
const applicationService = new CurriculumApplicationService(curriculumService);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
  const isActiveParam = searchParams.get('isActive');

  const filter: Record<string, unknown> = {};
  if (isActiveParam !== null) filter.isActive = isActiveParam === 'true';

  const page: Record<string, unknown> = { limit };

  try {
    const result = await applicationService.listStages(filter, page);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 400 },
      );
    }
    const gradesResult = await applicationService.listGrades({}, { limit: 100 });
    const gradesByStage = new Map<string, { id: string; name: string }[]>();
    if (gradesResult.ok) {
      for (const g of gradesResult.value.items) {
        const entry = gradesByStage.get(g.stageId) ?? [];
        entry.push({ id: g.id, name: g.nameAr });
        gradesByStage.set(g.stageId, entry);
      }
    }
    const stages = result.value.items.map((s) => ({
      id: s.id,
      name: s.nameAr,
      grades: gradesByStage.get(s.id) ?? [],
    }));
    return NextResponse.json(
      { success: true, data: stages, timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
