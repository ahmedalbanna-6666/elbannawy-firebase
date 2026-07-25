import { NextRequest, NextResponse } from 'next/server';
import { UnitService, UnitApplicationService, LessonRepository } from '@el-bannawy/lib';
import { toFrontendUnit, fromFrontendUnitCreate } from '../_shared/transforms';

const unitService = new UnitService();
const applicationService = new UnitApplicationService(unitService);
const lessonRepo = new LessonRepository();

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
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const isActiveParam = searchParams.get('isActive');
  const academicTermId = searchParams.get('academicTermId') ?? searchParams.get('termId');
  const gradeId = searchParams.get('gradeId');
  const academicYearId = searchParams.get('academicYearId');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = {};
  if (isActiveParam !== null) filter.isActive = isActiveParam === 'true';
  if (academicTermId) filter.academicTermId = academicTermId;
  if (gradeId) filter.gradeId = gradeId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (search) filter.search = search;

  const page: Record<string, unknown> = { limit };
  if (cursor) page.cursor = cursor;

  try {
    const unitsResult = academicTermId
      ? await applicationService.getUnitsByTerm(academicTermId)
      : await applicationService.listUnits(filter, page);
    if (!unitsResult.ok) return NextResponse.json({ success: false, error: unitsResult.error }, { status: mapErrorCode(unitsResult.error.code) });

    const rawItems = academicTermId
      ? (unitsResult.value as unknown as Record<string, unknown>[])
      : ((unitsResult.value as unknown as { items: Record<string, unknown>[] }).items);

    const lessonCounts = new Map<string, number>();
    const unitIds = rawItems.map((u) => u.id as string).filter(Boolean);
    if (unitIds.length > 0) {
      await Promise.all(unitIds.map(async (uid) => {
        const lessonsResult = await lessonRepo.getPublishedLessons(uid);
        if (lessonsResult.ok) lessonCounts.set(uid, lessonsResult.value.length);
      }));
    }

    const items = rawItems.map((u) => toFrontendUnit({ ...u, _lessonCount: lessonCounts.get(u.id as string) ?? 0 }));
    const nextCursor = academicTermId ? null : (unitsResult.value as unknown as { nextCursor: string | null }).nextCursor;
    return NextResponse.json({ success: true, data: { items, nextCursor } });
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
    const payload = fromFrontendUnit(body);
    const result = await applicationService.createUnit(payload);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    return NextResponse.json({ success: true, data: toFrontendUnit(result.value as unknown as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
