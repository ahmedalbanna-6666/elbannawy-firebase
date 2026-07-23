import { NextRequest, NextResponse } from 'next/server';
import { CurriculumService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();

export async function GET(): Promise<NextResponse> {
  try {
    const result = await curriculumService.listEducationalSystems({}, { limit: 100 });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.value.items });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list educational systems' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { name?: string; nameAr?: string; description?: string; id?: string };
    if (!body.name || !body.nameAr) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'name and nameAr are required' } }, { status: 400 });
    }
    const id = body.id ?? `sys-${String(Date.now())}`;
    const result = await curriculumService.createEducationalSystem({
      id,
      name: body.name,
      nameAr: body.nameAr,
      description: body.description,
      isActive: true,
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create educational system' } }, { status: 500 });
  }
}
