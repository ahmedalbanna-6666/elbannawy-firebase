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

function mapErrorCode(code: string): number {
  switch (code) {
    case 'INVALID_INPUT': return 400;
    case 'NOT_FOUND': return 404;
    case 'ALREADY_EXISTS': return 409;
    case 'CONFLICT': return 409;
    case 'FORBIDDEN': return 403;
    case 'PRECONDITION_FAILED': return 412;
    case 'RATE_LIMITED': return 429;
    case 'UNAVAILABLE': return 503;
    default: return 500;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { searchParams } = new URL(_request.url);
  const collection = searchParams.get('collection') ?? 'educational-systems';
  const { id } = await params;

  try {
    switch (collection) {
      case 'educational-systems': {
        const result = await applicationService.getEducationalSystemById(id);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'stages': {
        const result = await applicationService.getStageById(id);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'grades': {
        const result = await applicationService.getGradeById(id);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'academic-years': {
        const result = await applicationService.getAcademicYearById(id);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'academic-terms': {
        const result = await applicationService.getAcademicTermById(id);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      default:
        return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: `Invalid collection: ${collection}` }, timestamp: new Date().toISOString() }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection') ?? 'educational-systems';
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  const expectedVersion = Number(body._expectedVersion) || 0;

  try {
    switch (collection) {
      case 'educational-systems': {
        const result = await applicationService.updateEducationalSystem(id, body, expectedVersion);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'stages': {
        const result = await applicationService.updateStage(id, body, expectedVersion);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'grades': {
        const result = await applicationService.updateGrade(id, body, expectedVersion);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'academic-years': {
        const result = await applicationService.updateAcademicYear(id, body, expectedVersion);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'academic-terms': {
        const result = await applicationService.updateAcademicTerm(id, body, expectedVersion);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      default:
        return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: `Invalid collection: ${collection}` }, timestamp: new Date().toISOString() }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { searchParams } = new URL(_request.url);
  const collectionParam = searchParams.get('collection') ?? 'educational-systems';
  const collection = COLLECTION_MAP[collectionParam];
  if (!collection) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: `Invalid collection: ${collectionParam}` }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  const { id } = await params;
  const requestId = `delete-${id}-${String(Date.now())}`;

  try {
    const result = await applicationService.softDeleteCurriculum(id, collection as 'educationalSystems' | 'stages' | 'grades' | 'academicYears' | 'academicTerms', requestId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
