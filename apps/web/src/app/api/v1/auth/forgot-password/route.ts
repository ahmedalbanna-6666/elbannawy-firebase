import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { UserService } from '@el-bannawy/lib';

const userService = new UserService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { mobile } = (await request.json()) as { mobile: string };
    if (!mobile) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Mobile number is required' } },
        { status: 400 },
      );
    }

    const result = await userService.findUserByMobile(mobile);

    if (!result.ok || !result.value) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No account found with this mobile number' } },
        { status: 404 },
      );
    }

    const user = result.value;
    const adminAuth = getAdminAuth();
    const firebaseUser = await adminAuth.getUser(user.id);
    const email = firebaseUser.email ?? `${user.mobileNumber}@el-bannawy.app`;

    await adminAuth.generatePasswordResetLink(email);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this mobile number, a password reset link has been sent.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
