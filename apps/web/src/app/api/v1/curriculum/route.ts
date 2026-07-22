import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService, CurriculumApplicationService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();
const applicationService = new CurriculumApplicationService(curriculumService);

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection') ?? 'educational-systems';
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const isActiveParam = searchParams.get('isActive');
  const systemId = searchParams.get('educationalSystemId');
  const stageId = searchParams.get('stageId');
  const academicYearId = searchParams.get('academicYearId');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = {};
  if (isActiveParam !== null) filter.isActive = isActiveParam === 'true';
  if (systemId) filter.educationalSystemId = systemId;
  if (stageId) filter.stageId = stageId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (search) filter.search = search;

  const page: Record<string, unknown> = { limit };
  if (cursor) page.cursor = cursor;

  try {
    switch (collection) {
      case 'educational-systems': {
        const result = await applicationService.listEducationalSystems(filter, page);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'stages': {
        if (systemId) {
          const result = await applicationService.getStagesBySystem(systemId);
          if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
          }
          return NextResponse.json({ success: true, data: { items: result.value, nextCursor: null }, timestamp: new Date().toISOString() }, { status: 200 });
        }
        const result = await applicationService.listStages(filter, page);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'grades': {
        if (stageId) {
          const result = await applicationService.getGradesByStage(stageId);
          if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
          }
          return NextResponse.json({ success: true, data: { items: result.value, nextCursor: null }, timestamp: new Date().toISOString() }, { status: 200 });
        }
        const result = await applicationService.listGrades(filter, page);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'academic-years': {
        const result = await applicationService.listAcademicYears(filter, page);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
      }
      case 'academic-terms': {
        if (academicYearId) {
          const result = await applicationService.getTermsByAcademicYear(academicYearId);
          if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
          }
          return NextResponse.json({ success: true, data: { items: result.value, nextCursor: null }, timestamp: new Date().toISOString() }, { status: 200 });
        }
        const result = await applicationService.listAcademicTerms(filter, page);
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection') ?? 'educational-systems';

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  try {
    switch (collection) {
      case 'educational-systems': {
        const result = await applicationService.createEducationalSystem(body);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 201 });
      }
      case 'stages': {
        const result = await applicationService.createStage(body);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 201 });
      }
      case 'grades': {
        const result = await applicationService.createGrade(body);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 201 });
      }
      case 'academic-years': {
        const result = await applicationService.createAcademicYear(body);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 201 });
      }
      case 'academic-terms': {
        const result = await applicationService.createAcademicTerm(body);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
        }
        return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 201 });
      }
      default:
        return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: `Invalid collection: ${collection}` }, timestamp: new Date().toISOString() }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
