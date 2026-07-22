import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService, CurriculumApplicationService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();
const applicationService = new CurriculumApplicationService(curriculumService);

const COLLECTION_MAP: Record<string, string> = {
  'educational-systems': 'educationalSystems',
  'stages': 'stages',
  'grades': 'grades',
  'academic-years': 'academicYears',
  'academic-terms': 'academicTerms',
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { searchParams } = new URL(_request.url);
  const collectionParam = searchParams.get('collection') ?? 'educational-systems';
  const collection = COLLECTION_MAP[collectionParam];
  if (!collection) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: `Invalid collection: ${collectionParam}` }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const requestId = `restore-${id}-${String(Date.now())}`;

  try {
    const result = await applicationService.restoreCurriculum(id, collection as 'educationalSystems' | 'stages' | 'grades' | 'academicYears' | 'academicTerms', requestId);
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
