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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || `lesson-${String(Date.now())}`;
}

function fromFrontendLesson(body: Record<string, unknown>): Record<string, unknown> {
  const title = (body.title ?? body.name ?? '') as string;
  return {
    id: body.id ?? `lesson-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`,
    unitId: (body.unitId ?? '') as string,
    title,
    slug: (body.slug as string) ?? slugify(title),
    description: (body.description as string) ?? '',
    displayOrder: (body.displayOrder as number) ?? (body.order as number) ?? 0,
    isPublished: body.published === true || body.isPublished === true,
    status: body.status ?? (body.published === true ? 'published' : 'draft'),
    isVisible: body.isVisible !== false,
    estimatedDuration: (body.estimatedDuration as number) ?? undefined,
  };
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
