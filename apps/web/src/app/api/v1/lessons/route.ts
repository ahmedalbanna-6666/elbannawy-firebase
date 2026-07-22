import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService } from '@el-bannawy/lib';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);

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
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const unitId = searchParams.get('unitId');
  const status = searchParams.get('status');
  const isPublishedParam = searchParams.get('isPublished');
  const isVisibleParam = searchParams.get('isVisible');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = {};
  if (unitId) filter.unitId = unitId;
  if (status) filter.status = status;
  if (isPublishedParam !== null) filter.isPublished = isPublishedParam === 'true';
  if (isVisibleParam !== null) filter.isVisible = isVisibleParam === 'true';

  const page: Record<string, unknown> = { limit };
  if (cursor) page.cursor = cursor;

  try {
    if (search) {
      const result = await applicationService.searchLessons(search, page);
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
      }
      return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
    }
    if (unitId) {
      const result = await applicationService.getLessonsByUnit(unitId);
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
      }
      return NextResponse.json({ success: true, data: { items: result.value, nextCursor: null }, timestamp: new Date().toISOString() }, { status: 200 });
    }
    const result = await applicationService.listLessons(filter, page);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  try {
    const result = await applicationService.createLesson(body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
