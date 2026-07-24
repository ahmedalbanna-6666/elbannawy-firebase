import { NextRequest, NextResponse } from 'next/server';
import { UnitService, UnitApplicationService } from '@el-bannawy/lib';

const unitService = new UnitService();
const applicationService = new UnitApplicationService(unitService);

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

function toFrontendUnit(u: Record<string, unknown>): Record<string, unknown> {
  return {
    id: u.id,
    title: u.name ?? u.nameAr ?? '',
    description: u.description ?? null,
    displayOrder: u.order ?? 0,
    published: u.published ?? false,
    isPremium: u.isPremium ?? false,
    priceCoins: u.priceCoins ?? (u.isPremium ? 50 : 0),
    lockedOverride: null,
    createdAt: u.createdAt ?? new Date().toISOString(),
    updatedAt: u.updatedAt ?? new Date().toISOString(),
    grade: { id: u.gradeId ?? '', name: '', stage: { id: '', name: '' } },
    _count: { lessons: 0 },
  };
}

function fromFrontendUnit(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: body.id ?? `unit-${String(Date.now())}`,
    name: body.title ?? body.name ?? '',
    nameAr: body.title ?? body.name ?? '',
    description: body.description ?? '',
    order: body.displayOrder ?? body.order ?? 0,
    academicTermId: body.termId ?? body.academicTermId ?? '',
    isActive: true,
    isPremium: body.isPremium ?? false,
    priceCoins: body.priceCoins ?? (body.isPremium ? 50 : undefined),
    published: body.published ?? false,
  };
  if (body.isActive !== undefined) payload.isActive = body.isActive;
  if (body.lockedOverride !== undefined) payload.lockedOverride = body.lockedOverride;
  if (body.gradeId) payload.gradeId = body.gradeId;
  if (body.academicYearId) payload.academicYearId = body.academicYearId;
  if (body.educationalSystem) payload.educationalSystem = body.educationalSystem;
  return payload;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const isActiveParam = searchParams.get('isActive');
  const academicTermId = searchParams.get('academicTermId') ?? searchParams.get('termId');
  const gradeId = searchParams.get('gradeId');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = {};
  if (isActiveParam !== null) filter.isActive = isActiveParam === 'true';
  if (academicTermId) filter.academicTermId = academicTermId;
  if (gradeId) filter.gradeId = gradeId;
  if (search) filter.search = search;

  const page: Record<string, unknown> = { limit };
  if (cursor) page.cursor = cursor;

  try {
    if (academicTermId) {
      const result = await applicationService.getUnitsByTerm(academicTermId);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
      const items = (result.value as unknown as Record<string, unknown>[]).map(toFrontendUnit);
      return NextResponse.json({ success: true, data: { items, nextCursor: null } });
    }
    const result = await applicationService.listUnits(filter, page);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    const items = ((result.value as unknown as { items: Record<string, unknown>[] }).items).map(toFrontendUnit);
    const nextCursor = (result.value as unknown as { nextCursor: string | null }).nextCursor;
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
