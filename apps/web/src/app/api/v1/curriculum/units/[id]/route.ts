import { NextRequest, NextResponse } from 'next/server';
import { UnitService, UnitApplicationService } from '@el-bannawy/lib';

const unitService = new UnitService();
const applicationService = new UnitApplicationService(unitService);

function toFrontendUnit(u: Record<string, unknown>): Record<string, unknown> {
  return {
    id: u.id,
    title: u.name ?? u.nameAr ?? '',
    description: u.description ?? null,
    displayOrder: u.order ?? 0,
    published: u.published ?? false,
    isPremium: u.isPremium ?? false,
    lockedOverride: null,
    createdAt: u.createdAt ?? new Date().toISOString(),
    updatedAt: u.updatedAt ?? new Date().toISOString(),
    grade: { id: u.gradeId ?? '', name: '', stage: { id: '', name: '' } },
    _count: { lessons: 0 },
  };
}

function fromFrontendUnit(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (body.title !== undefined) { payload.name = body.title; payload.nameAr = body.title; }
  if (body.description !== undefined) payload.description = body.description;
  if (body.displayOrder !== undefined) payload.order = body.displayOrder;
  if (body.order !== undefined) payload.order = body.order;
  if (body.published !== undefined) payload.published = body.published;
  if (body.isPremium !== undefined) payload.isPremium = body.isPremium;
  if (body.isActive !== undefined) payload.isActive = body.isActive;
  if (body.lockedOverride !== undefined) payload.lockedOverride = body.lockedOverride;
  return payload;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const result = await applicationService.getUnitById(id);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: toFrontendUnit(result.value as unknown as Record<string, unknown>) });
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
    const payload = fromFrontendUnit(body);
    const result = await applicationService.updateUnit(id, payload, 0);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: toFrontendUnit(result.value as unknown as Record<string, unknown>) });
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
