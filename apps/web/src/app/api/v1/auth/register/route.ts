import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

interface RegisterBody {
  email?: string;
  mobile: string;
  password: string;
  fullName: string;
  englishName?: string;
  parentMobile?: string;
  governorate?: string;
  school?: string;
  educationalSystem?: string;
  educationalStage?: string;
  grade?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RegisterBody = (await request.json()) as RegisterBody;

    if (!body.mobile || !body.password || !body.fullName) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const email = body.email ?? `${body.mobile}@el-bannawy.app`;

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const userRecord = await adminAuth.createUser({
      email,
      password: body.password,
      displayName: body.fullName,
    });

    const now = new Date().toISOString();
    await adminDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      fullName: body.fullName,
      englishName: body.englishName ?? null,
      mobileNumber: body.mobile,
      parentMobile: body.parentMobile ?? null,
      role: 'student',
      status: 'active',
      isActive: true,
      email: body.email ?? null,
      governorate: body.governorate ?? null,
      school: body.school ?? null,
      educationalSystem: body.educationalSystem ?? null,
      educationalStage: body.educationalStage ?? null,
      grade: body.grade ?? null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    });

    return NextResponse.json({ success: true, data: { uid: userRecord.uid } }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
