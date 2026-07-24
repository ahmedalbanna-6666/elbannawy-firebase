import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService, CurriculumApplicationService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();
const applicationService = new CurriculumApplicationService(curriculumService);

const COLLECTION_MAP: Record<string, string> = {
  'academic-years': 'academicYears',
  'academic-terms': 'academicTerms',
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { searchParams } = new URL(_request.url);
  const collectionParam = searchParams.get('collection') ?? '';
  const collection = COLLECTION_MAP[collectionParam];
  if (!collection) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: `Collection does not support restore: ${collectionParam}` }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const requestId = `restore-${id}-${String(Date.now())}`;

  try {
    const result = await applicationService.restoreCurriculum(id, collection as 'academicYears' | 'academicTerms', requestId);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: true, data: null, timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
