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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const isActiveParam = searchParams.get('isActive');
  const academicTermId = searchParams.get('academicTermId');
  const isPremiumParam = searchParams.get('isPremium');
  const publishedParam = searchParams.get('published');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = {};
  if (isActiveParam !== null) filter.isActive = isActiveParam === 'true';
  if (academicTermId) filter.academicTermId = academicTermId;
  if (isPremiumParam !== null) filter.isPremium = isPremiumParam === 'true';
  if (publishedParam !== null) filter.published = publishedParam === 'true';
  if (search) filter.search = search;

  const page: Record<string, unknown> = { limit };
  if (cursor) page.cursor = cursor;

  try {
    if (academicTermId) {
      const result = await applicationService.getUnitsByTerm(academicTermId);
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
      }
      return NextResponse.json({ success: true, data: { items: result.value, nextCursor: null }, timestamp: new Date().toISOString() }, { status: 200 });
    }
    const result = await applicationService.listUnits(filter, page);
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
    const result = await applicationService.createUnit(body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
