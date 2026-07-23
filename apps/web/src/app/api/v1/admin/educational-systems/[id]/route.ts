import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const result = await curriculumService.getEducationalSystemById(id);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch educational system' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { name?: string; nameAr?: string; description?: string; isActive?: boolean };
    const result = await curriculumService.updateEducationalSystem(id, body, 0);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update educational system' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const requestId = `del-edusys-${String(Date.now())}`;
    const result = await curriculumService.softDeleteCurriculum(id, 'educationalSystems', requestId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to delete educational system' } }, { status: 500 });
  }
}
