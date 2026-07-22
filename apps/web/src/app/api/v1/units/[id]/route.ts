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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const result = await applicationService.getUnitById(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  const expectedVersion = Number(body._expectedVersion) || 0;

  try {
    const result = await applicationService.updateUnit(id, body, expectedVersion);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const requestId = `delete-${id}-${String(Date.now())}`;

  try {
    const result = await applicationService.softDeleteUnit(id, requestId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
