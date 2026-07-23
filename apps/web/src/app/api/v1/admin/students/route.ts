import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const gradeId = searchParams.get('gradeId');
  const stageId = searchParams.get('stageId');

  try {
    const db = getAdminDb();
    let query = db.collection('users').where('role', '==', 'student');
    if (status === 'active') query = query.where('status', '==', 'active');
    else if (status === 'inactive') query = query.where('status', '==', 'inactive');
    else if (status === 'suspended') query = query.where('status', '==', 'suspended');
    else if (status === 'banned') query = query.where('status', '==', 'banned');
    else if (status === 'deleted') query = query.where('deletedAt', '!=', null);
    else query = query.where('deletedAt', '==', null);

    const allSnapshot = await query.get();
    let allUsers = allSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Record<string, unknown>[];

    if (search) {
      const s = search.toLowerCase();
      allUsers = allUsers.filter(
        (u) =>
          (typeof u.fullName === 'string' && u.fullName.toLowerCase().includes(s)) ||
          (typeof u.englishName === 'string' && u.englishName.toLowerCase().includes(s)) ||
          (typeof u.mobileNumber === 'string' && u.mobileNumber.includes(s)) ||
          (typeof u.email === 'string' && u.email.toLowerCase().includes(s)),
      );
    }
    if (gradeId) allUsers = allUsers.filter((u) => u.gradeId === gradeId);
    if (stageId) allUsers = allUsers.filter((u) => u.stageId === stageId);

    const total = allUsers.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const pagedUsers = allUsers.slice(start, start + limit);

    const students = pagedUsers.map((u) => ({
      id: u.id as string,
      fullName: u.fullName as string ?? '',
      englishName: (u.englishName as string) ?? null,
      email: (u.email as string) ?? null,
      mobileNumber: (u.mobileNumber as string) ?? null,
      parentMobile: (u.parentMobile as string) ?? null,
      role: 'STUDENT',
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
    }));

    return NextResponse.json({ success: true, data: { students, meta: { total, page, limit, totalPages } } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list students' } }, { status: 500 });
  }
}
