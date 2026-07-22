import { NextResponse } from 'next/server';
import { CurriculumService } from '@el-bannawy/lib';

const curriculumService = new CurriculumService();

export async function GET(): Promise<NextResponse> {
  try {
    const result = await curriculumService.listStages({}, { limit: 100 });
    if (!result.ok) return NextResponse.json({ success: true, data: [] });
    const items = result.value.items.map(s => ({ id: s.id, name: s.name, displayOrder: s.order }));
    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
