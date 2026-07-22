import { NextRequest, NextResponse } from 'next/server';
import { UnitService, UnitApplicationService } from '@el-bannawy/lib';

const unitService = new UnitService();
const applicationService = new UnitApplicationService(unitService);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  let body: { order?: number };
  try {
    body = await request.json() as { order?: number };
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  if (body.order === undefined || typeof body.order !== 'number' || body.order < 0 || !Number.isInteger(body.order)) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'order must be a non-negative integer' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  try {
    const result = await applicationService.updateUnit(id, { order: body.order }, 0);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
