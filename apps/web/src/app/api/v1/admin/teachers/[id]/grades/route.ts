import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { gradeIds?: string[] };
    const db = (await import('@/lib/firebase/admin')).getAdminDb();
    await db.collection('teacherAssignments').doc('ta-' + id).set({
      teacherId: id,
      gradeIds: body.gradeIds ?? [],
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return NextResponse.json({ success: true, data: { id, gradeIds: body.gradeIds } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to assign grades' } }, { status: 500 });
  }
}
