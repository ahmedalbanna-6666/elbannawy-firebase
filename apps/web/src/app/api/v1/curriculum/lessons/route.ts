import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService } from '@el-bannawy/lib';
import { fromFrontendLesson } from '@/app/api/v1/curriculum/_shared/transforms';

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
  const unitId = searchParams.get('unitId');
  const search = searchParams.get('search');
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const page: Record<string, unknown> = { limit };
  if (cursor) page.cursor = cursor;

  try {
    if (search) {
      const result = await applicationService.searchLessons(search, page);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
      return NextResponse.json({ success: true, data: result.value });
    }
    if (unitId) {
      const result = await applicationService.getLessonsByUnit(unitId);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
      return NextResponse.json({ success: true, data: { items: result.value, nextCursor: null } });
    }
    const result = await applicationService.listLessons({}, page);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
  }
  try {
    const payload = fromFrontendLesson(body);
    const result = await applicationService.createLesson(payload);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
