import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } }, { status: 404 });

    const u = doc.data() as Record<string, unknown>;
    const student = {
      id,
      fullName: u.fullName as string ?? '',
      englishName: (u.englishName as string) ?? null,
      email: (u.email as string) ?? null,
      mobileNumber: (u.mobileNumber as string) ?? null,
      parentMobile: (u.parentMobile as string) ?? null,
      role: (u.role as string)?.toUpperCase() ?? 'STUDENT',
      status: (u.status as string) ?? 'active',
      educationalSystem: (u.educationalSystem as string) ?? null,
      gradeId: (u.gradeId as string) ?? null,
      stageId: (u.stageId as string) ?? null,
      academicYearId: (u.academicYearId as string) ?? null,
      termId: (u.termId as string) ?? null,
      governorate: (u.governorate as string) ?? null,
      school: (u.school as string) ?? null,
      coins: typeof u.coins === 'number' ? u.coins : 0,
      createdAt: (u.createdAt as string) ?? new Date().toISOString(),
      updatedAt: (u.updatedAt as string) ?? new Date().toISOString(),
      deletedAt: (u.deletedAt as string) ?? null,
    };

    return NextResponse.json({ success: true, data: student });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch student' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.englishName !== undefined) updateData.englishName = body.englishName;
    if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber;
    if (body.parentMobile !== undefined) updateData.parentMobile = body.parentMobile;
    if (body.governorate !== undefined) updateData.governorate = body.governorate;
    if (body.school !== undefined) updateData.school = body.school;
    if (body.gradeId !== undefined) updateData.gradeId = body.gradeId;
    await db.collection('users').doc(id).update(updateData);
    const updated = await db.collection('users').doc(id).get();
    return NextResponse.json({ success: true, data: { id, ...updated.data() } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update student' } }, { status: 500 });
  }
}
