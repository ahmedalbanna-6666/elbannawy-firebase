import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const db = getAdminDb();
    const [yearsSnap, termsSnap] = await Promise.all([
      db.collection('academicYears').where('deletedAt', '==', null).orderBy('createdAt', 'desc').get().catch(() => db.collection('academicYears').where('deletedAt', '==', null).get()),
      db.collection('academicTerms').where('deletedAt', '==', null).orderBy('order', 'asc').get().catch(() => db.collection('academicTerms').where('deletedAt', '==', null).get()),
    ]);

    const termsByYear = new Map<string, { id: string; name: string; academicYearId: string; displayOrder: number }[]>();
    for (const t of termsSnap.docs) {
      const data = t.data();
      const yearId = data.academicYearId as string;
      if (!termsByYear.has(yearId)) termsByYear.set(yearId, []);
      termsByYear.get(yearId)!.push({
        id: t.id,
        name: (data.name as string) ?? (data.nameAr as string) ?? '',
        academicYearId: yearId,
        displayOrder: (data.order as number) ?? 0,
      });
    }

    const items = yearsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: (data.name as string) ?? (data.nameAr as string) ?? '',
        nameAr: (data.nameAr as string) ?? (data.name as string) ?? '',
        educationalSystemId: (data.educationalSystemId as string) ?? null,
        isActive: (data.isActive as boolean) ?? true,
        isCurrent: (data.isCurrent as boolean) ?? false,
        startDate: (data.startDate as string) ?? null,
        endDate: (data.endDate as string) ?? null,
        terms: termsByYear.get(d.id) ?? [],
        _count: { users: 0, units: 0 },
      };
    });

    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list academic years' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const docRef = db.collection('academicYears').doc();
    const startDate = (body.startDate as string) ?? (body.name as string) ?? now;
    const yearData = {
      ...body,
      id: docRef.id,
      startDate,
      name: body.name as string ?? '',
      nameAr: (body.nameAr as string) ?? (body.name as string) ?? '',
      educationalSystemId: (body.educationalSystemId as string) ?? body.educationalSystem as string ?? null,
      isActive: true,
      isCurrent: body.isCurrent === true,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(yearData);
    const saved = { ...yearData, id: docRef.id };
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create academic year' } }, { status: 500 });
  }
}
