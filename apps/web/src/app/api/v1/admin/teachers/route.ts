import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  try {
    const db = getAdminDb();
    let query = db.collection('users').where('role', '==', 'teacher');
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

    const total = allUsers.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const pagedUsers = allUsers.slice(start, start + limit);

    const teachers = pagedUsers.map((u) => ({
      id: u.id as string,
      fullName: u.fullName as string ?? '',
      englishName: u.englishName as string ?? null,
      email: u.email as string ?? null,
      mobileNumber: u.mobileNumber as string ?? null,
      role: 'TEACHER',
      status: (u.status as string) ?? 'active',
      governorate: u.governorate as string ?? null,
      school: u.school as string ?? null,
      createdAt: u.createdAt as string ?? new Date().toISOString(),
      updatedAt: u.updatedAt as string ?? new Date().toISOString(),
      lastLogin: u.lastLogin as string ?? null,
      assignedGrades: [],
    }));

    return NextResponse.json({ success: true, data: { teachers, meta: { total, page, limit, totalPages } } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list teachers' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const id = body.id as string ?? `teacher-${String(Date.now())}`;
    const now = new Date().toISOString();
    const userData = {
      id,
      role: 'teacher',
      fullName: body.fullName as string ?? '',
      englishName: (body.englishName as string) ?? null,
      email: (body.email as string) ?? null,
      mobileNumber: (body.mobileNumber as string) ?? '',
      governorate: (body.governorate as string) ?? null,
      school: (body.school as string) ?? null,
      status: 'active',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.collection('users').doc(id).set(userData);
    const saved = { ...userData, id };
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create teacher' } }, { status: 500 });
  }
}
