import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { UserService, CreateUserInputSchema } from '@el-bannawy/lib';

const userService = new UserService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.fullName || !body.mobile) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Missing required fields: fullName, mobile' } },
        { status: 400 },
      );
    }

    const existing = await userService.getUserById(decoded.uid);
    if (existing.ok) {
      return NextResponse.json(
        { success: true, data: { uid: decoded.uid } },
      );
    }

    const normalizedMobile = String(body.mobile).startsWith('+')
      ? String(body.mobile)
      : `+2${String(body.mobile)}`;

    const createInput = {
      id: decoded.uid,
      role: 'student' as const,
      fullName: body.fullName as string,
      mobileNumber: normalizedMobile,
      isActive: true,
      email: body.email as string | undefined,
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
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.message } },
        { status: 400 },
      );
    }

    const result = await userService.createUser(parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: { uid: decoded.uid } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'OAuth registration failed';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: msg } },
      { status: 400 },
    );
  }
}
