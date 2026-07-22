import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService, CurriculumApplicationService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();
const applicationService = new CurriculumApplicationService(curriculumService);

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const result = await applicationService.getCurrentAcademicContext();
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: true, data: result.value, timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
