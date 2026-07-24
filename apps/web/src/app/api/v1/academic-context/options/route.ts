import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService } from '@el-bannawy/lib';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

interface StageOption {
  id: string;
  name: string;
  grades: { id: string; name: string }[];
}

interface TermOption {
  id: string;
  name: string;
}

const curriculumService = new CurriculumService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const [stagesResult, gradesResult, termsResult] = await Promise.all([
      curriculumService.listStages({ isActive: true }, { limit: 50 }),
      curriculumService.listGrades({ isActive: true }, { limit: 100 }),
      curriculumService.listAcademicTerms({ isActive: true }, { limit: 50 }),
    ]);

    const stageGradeMap = new Map<string, { id: string; name: string }[]>();
    if (gradesResult.ok) {
      for (const grade of gradesResult.value.items) {
        const entry = stageGradeMap.get(grade.stageId) ?? [];
        entry.push({ id: grade.id, name: grade.nameAr });
        stageGradeMap.set(grade.stageId, entry);
      }
    }

    const stages: StageOption[] = stagesResult.ok
      ? stagesResult.value.items.map((stage) => ({
          id: stage.id,
          name: stage.nameAr,
          grades: stageGradeMap.get(stage.id) ?? [],
        }))
      : [];

    const terms: TermOption[] = termsResult.ok
      ? termsResult.value.items.map((term) => ({
          id: term.id,
          name: term.nameAr,
        }))
      : [];

    return NextResponse.json(
      {
        success: true,
        data: { stages, terms },
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
