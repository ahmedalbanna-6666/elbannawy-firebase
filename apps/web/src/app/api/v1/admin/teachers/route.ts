import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  try {
    const db = getAdminDb();
    // Support both nested role { role: 'teacher' } and flat role 'teacher' formats
    const allSnapshot = await db.collection('users')
      .where('deletedAt', '==', null)
      .limit(500)
      .get();

    let allUsers = allSnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() })) as Record<string, unknown>[];

    // Filter by role: teacher (support both nested and flat)
    allUsers = allUsers.filter((u) => {
      const r = u.role;
      const roleStr = typeof r === 'object' && r !== null
        ? String((r as Record<string, unknown>).role ?? '')
        : String(r ?? '');
      return roleStr === 'teacher';
    });

    // Filter by status
    if (status) {
      allUsers = allUsers.filter((u) => {
        const s = u.status;
        const statusStr = typeof s === 'object' && s !== null
          ? String((s as Record<string, unknown>).status ?? '')
          : String(s ?? '');
        return statusStr === status;
      });
    }

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

    const teachers = await Promise.all(pagedUsers.map(async (u) => {
      const uRole = u.role as Record<string, unknown> | undefined;
      const roleStr = typeof uRole === 'object' && uRole !== null
        ? String(uRole.role ?? 'teacher')
        : 'TEACHER';
      const uStatus = u.status as Record<string, unknown> | undefined;
      const statusStr = typeof uStatus === 'object' && uStatus !== null
        ? String(uStatus.status ?? 'active')
        : String(u.status ?? 'active');

      let gradeCount = 0;
      let studentCount = 0;
      try {
        const assignSnap = await db.collection('teacherAssignments')
          .where('teacherId', '==', u.id as string)
          .where('deletedAt', '==', null)
          .where('status', '==', 'active')
          .get();
        gradeCount = assignSnap.size;

        const gradeIds = assignSnap.docs.map((d) => (d.data() as { gradeId: string }).gradeId);
        const userCounts = await Promise.all(
          gradeIds.map((gid) =>
            db.collection('users').where('gradeId', '==', gid).where('deletedAt', '==', null).count().get().catch(() => null),
          ),
        );
        studentCount = userCounts.reduce((sum, c) => sum + (c?.data().count ?? 0), 0);
      } catch {
        // Fallback to zero
      }

      return {
        id: u.id as string,
        fullName: u.fullName as string ?? '',
        englishName: u.englishName as string ?? null,
        email: u.email as string ?? null,
        mobileNumber: u.mobileNumber as string ?? null,
        role: roleStr.toUpperCase(),
        status: statusStr,
        governorate: u.governorate as string ?? null,
        school: u.school as string ?? null,
        createdAt: u.createdAt as string ?? new Date().toISOString(),
        updatedAt: u.updatedAt as string ?? new Date().toISOString(),
        lastLogin: u.lastLogin as string ?? null,
        assignedGrades: [],
        _count: { grades: gradeCount, students: studentCount },
      };
    }));

    return NextResponse.json({ success: true, data: { teachers, meta: { total, page, limit, totalPages } } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list teachers' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json() as Record<string, unknown>;
    const adminAuth = (await import('@/lib/firebase/admin')).getAdminAuth();
    const db = getAdminDb();
    const now = new Date().toISOString();
    const id = body.id as string ?? `teacher-${String(Date.now())}`;
    const mobile = body.mobileNumber as string ?? '';
    const email = body.email as string || (mobile ? `${mobile.replace(/[^0-9]/g, '')}@el-bannawy.app` : `teacher-${id}@el-bannawy.app`);
    const password = body.password as string || 'teacher123456';

    try {
      await adminAuth.createUser({
        uid: id,
        email,
        password,
        displayName: body.fullName as string ?? '',
      });
      await adminAuth.setCustomUserClaims(id, { role: 'teacher' });
    } catch (authError) {
      // User may already exist in Firebase Auth, try to update claims
      try {
        await adminAuth.setCustomUserClaims(id, { role: 'teacher' });
      } catch {
        // Firebase Auth user creation failed
      }
    }

    const userData = {
      id,
      role: { role: 'teacher', grantedAt: now },
      fullName: body.fullName as string ?? '',
      englishName: (body.englishName as string) ?? null,
      email,
      mobileNumber: mobile,
      governorate: (body.governorate as string) ?? null,
      school: (body.school as string) ?? null,
      status: { status: 'active' },
      isActive: true,
      schemaVersion: 1,
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
