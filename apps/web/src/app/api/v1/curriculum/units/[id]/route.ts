import { NextRequest, NextResponse } from 'next/server';
import { UnitService, UnitApplicationService, LessonRepository } from '@el-bannawy/lib';
import { toFrontendUnit, toFrontendLesson, fromFrontendUnitUpdate } from '../../_shared/transforms';

const unitService = new UnitService();
const applicationService = new UnitApplicationService(unitService);
const lessonRepo = new LessonRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const [unitResult, lessonsResult] = await Promise.all([
      applicationService.getUnitById(id),
      lessonRepo.getLessonsByUnit(id),
    ]);
    if (!unitResult.ok) return NextResponse.json({ success: false, error: unitResult.error }, { status: 404 });
    const unit = toFrontendUnit(unitResult.value as unknown as Record<string, unknown>);
    const lessons = lessonsResult.ok
      ? lessonsResult.value.map((l) => toFrontendLesson(l as unknown as Record<string, unknown>))
      : [];
    return NextResponse.json({ success: true, data: { ...unit, lessons } });
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
    const payload = fromFrontendUnitUpdate(body);
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
