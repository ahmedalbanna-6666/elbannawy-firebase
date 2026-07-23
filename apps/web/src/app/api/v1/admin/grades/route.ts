import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();

export async function GET(): Promise<NextResponse> {
  try {
    const result = await curriculumService.listGrades({}, { limit: 100 });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.value.items });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list grades' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { name?: string; nameAr?: string; stageId?: string; educationalSystemId?: string; order?: number; id?: string };
    if (!body.name || !body.nameAr || !body.stageId || !body.educationalSystemId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'name, nameAr, stageId, and educationalSystemId are required' } }, { status: 400 });
    }
    const id = body.id ?? `grade-${String(Date.now())}`;
    const result = await curriculumService.createGrade({
      id,
      name: body.name,
      nameAr: body.nameAr,
      stageId: body.stageId,
      educationalSystemId: body.educationalSystemId,
      order: body.order ?? 0,
      isActive: true,
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create grade' } }, { status: 500 });
  }
}
