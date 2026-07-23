import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(): Promise<NextResponse> {
  try {
    const db = getAdminDb();
    const [stagesSnap, gradesSnap] = await Promise.all([
      db.collection('stages').where('deletedAt', '==', null).orderBy('order', 'asc').get(),
      db.collection('grades').where('deletedAt', '==', null).orderBy('order', 'asc').get(),
    ]);

    const gradesByStage = new Map<string, { id: string; name: string; nameAr: string; displayOrder: number; _count: { users: number } }[]>();
    for (const g of gradesSnap.docs) {
      const data = g.data();
      const stageId = data.stageId as string;
      if (!gradesByStage.has(stageId)) gradesByStage.set(stageId, []);
      gradesByStage.get(stageId)!.push({
        id: g.id,
        name: (data.name as string) ?? '',
        nameAr: (data.nameAr as string) ?? (data.name as string) ?? '',
        displayOrder: (data.order as number) ?? 0,
        _count: { users: 0 },
      });
    }

    const stages = stagesSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: (data.name as string) ?? '',
        nameAr: (data.nameAr as string) ?? (data.name as string) ?? '',
        educationalSystemId: (data.educationalSystemId as string) ?? '',
        order: (data.order as number) ?? 0,
        isActive: (data.isActive as boolean) ?? true,
        grades: gradesByStage.get(d.id) ?? [],
      };
    });

    return NextResponse.json({ success: true, data: stages });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list stages' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { name?: string; nameAr?: string; educationalSystemId?: string; order?: number; id?: string };
    if (!body.name || !body.nameAr || !body.educationalSystemId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'name, nameAr, and educationalSystemId are required' } }, { status: 400 });
    }
    const db = getAdminDb();
    const { CurriculumService } = await import('@el-bannawy/lib');
    const curriculumService = new CurriculumService();
    const id = body.id ?? `stage-${String(Date.now())}`;
    const result = await curriculumService.createStage({
      id,
      name: body.name,
      nameAr: body.nameAr,
      educationalSystemId: body.educationalSystemId,
      order: body.order ?? 0,
      isActive: true,
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create stage' } }, { status: 500 });
  }
}
