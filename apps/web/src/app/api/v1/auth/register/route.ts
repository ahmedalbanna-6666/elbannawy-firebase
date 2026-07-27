import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { UserService, CreateUserInputSchema } from '@el-bannawy/lib';
import { checkRateLimit } from '@/lib/rate-limiter';

const userService = new UserService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateCheck = checkRateLimit(`auth:register:${ip}`, { maxRequests: 3, windowMs: 300_000 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Try again later.' } }, { status: 429 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.mobile || !body.password || !body.fullName) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Missing required fields: mobile, password, fullName' } },
        { status: 400 },
      );
    }

    const email = (body.email as string) ?? `${String(body.mobile).replace(/[+\s]/g, '')}@el-bannawy.app`;

    const adminAuth = getAdminAuth();

    const userRecord = await adminAuth.createUser({
      email,
      password: body.password as string,
      displayName: body.fullName as string,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'student' });

    const normalizedMobile = String(body.mobile).startsWith('+')
      ? String(body.mobile)
      : `+2${String(body.mobile)}`;

    const createInput = {
      id: userRecord.uid,
      role: 'student' as const,
      fullName: body.fullName as string,
      mobileNumber: normalizedMobile,
      isActive: true,
      email: email,
      englishName: body.englishName as string | undefined,
      parentMobile: body.parentMobile as string | undefined,
      governorate: body.governorate as string | undefined,
      school: body.school as string | undefined,
      educationalSystemId: body.educationalSystem as string | undefined,
      stageId: body.educationalStage as string | undefined,
      gradeId: body.grade as string | undefined,
    };

    const parsed = CreateUserInputSchema.safeParse(createInput);
    if (!parsed.success) {
      await adminAuth.deleteUser(userRecord.uid);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.message } },
        { status: 400 },
      );
    }

    const result = await userService.createUser(parsed.data);

    if (!result.ok) {
      await adminAuth.deleteUser(userRecord.uid);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: { uid: userRecord.uid } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: msg } },
      { status: 400 },
    );
  }
}
