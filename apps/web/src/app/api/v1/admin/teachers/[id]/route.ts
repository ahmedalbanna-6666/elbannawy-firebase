import { NextRequest, NextResponse } from 'next/server';
import { GRADES, STAGES } from '@el-bannawy/lib';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Teacher not found' } }, { status: 404 });

    const u = doc.data() as Record<string, unknown>;
    const [gradesSnap, permissionsSnap] = await Promise.all([
      db.collection('teacherAssignments').where('teacherId', '==', id).where('deletedAt', '==', null).where('status', '==', 'active').select('gradeId').get().catch(() => null),
      db.collection('userPermissions').doc(id).get().catch(() => null),
    ]);

    const gradeIdList: string[] = gradesSnap?.empty === false
      ? gradesSnap.docs.map((d) => (d.data() as { gradeId?: string }).gradeId).filter(Boolean) as string[]
      : [];
    const grantedPermissions: string[] = permissionsSnap?.exists ? (permissionsSnap.data() as { permissions?: string[] })?.permissions ?? [] : [];

    const uRole = u.role as Record<string, unknown> | undefined;
    const roleStr = typeof uRole === 'object' && uRole !== null
      ? String(uRole.role ?? 'teacher')
      : String(u.role ?? 'teacher');
    const uStatus = u.status as Record<string, unknown> | undefined;
    const statusStr = typeof uStatus === 'object' && uStatus !== null
      ? String(uStatus.status ?? 'active')
      : String(u.status ?? 'active');

    const assignedGrades = await Promise.all(
      gradeIdList.map(async (gid) => {
        try {
          const grade = GRADES.find((g) => g.id === gid);
          const stage = grade ? STAGES.find((s) => s.id === grade.stageId) : null;
          const countSnap = await db.collection('users').where('gradeId', '==', gid).where('deletedAt', '==', null).count().get().catch(() => null);
          return {
            id: gid,
            name: grade?.nameAr ?? grade?.name ?? gid,
            stage: stage ? { id: stage.id, name: stage.nameAr } : grade ? { id: grade.stageId, name: '' } : { id: '', name: '' },
            _count: { users: countSnap?.data().count ?? 0 },
          };
        } catch {
          return null;
        }
      }),
    );

    const teacher = {
      id,
      fullName: u.fullName as string ?? '',
      englishName: (u.englishName as string) ?? null,
      email: (u.email as string) ?? null,
      mobileNumber: (u.mobileNumber as string) ?? null,
      role: roleStr.toUpperCase(),
      status: statusStr,
      governorate: (u.governorate as string) ?? null,
      school: (u.school as string) ?? null,
      createdAt: (u.createdAt as string) ?? new Date().toISOString(),
      updatedAt: (u.updatedAt as string) ?? new Date().toISOString(),
      deletedAt: (u.deletedAt as string) ?? null,
      lastLogin: (u.lastLogin as string) ?? null,
      assignedGrades: assignedGrades.filter(Boolean),
      grantedPermissions,
      gradeIds: gradeIdList,
    };

    return NextResponse.json({ success: true, data: teacher });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch teacher' } }, { status: 500 });
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
    if (body.email !== undefined) updateData.email = body.email;
    if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber;
    if (body.governorate !== undefined) updateData.governorate = body.governorate;
    if (body.school !== undefined) updateData.school = body.school;
    if (body.status !== undefined) updateData.status = { status: body.status as string };
    await db.collection('users').doc(id).update(updateData);
    const updated = await db.collection('users').doc(id).get();
    return NextResponse.json({ success: true, data: { id, ...updated.data() } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update teacher' } }, { status: 500 });
  }
}
