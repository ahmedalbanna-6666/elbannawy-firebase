import { NextRequest, NextResponse } from 'next/server';
import { UnitService, UnitApplicationService } from '@el-bannawy/lib';

const unitService = new UnitService();
const applicationService = new UnitApplicationService(unitService);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const result = await applicationService.getUnitById(id);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
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
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
  }
  try {
    const result = await applicationService.updateUnit(id, body, 0);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const requestId = 'delete-' + id + '-' + String(Date.now());
  try {
    const result = await applicationService.softDeleteUnit(id, requestId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
