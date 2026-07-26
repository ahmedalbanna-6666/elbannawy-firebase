import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { UserService } from '@el-bannawy/lib';
import { checkRateLimit } from '@/lib/rate-limiter';

const userService = new UserService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateCheck = checkRateLimit(`auth:reset-password:${ip}`, { maxRequests: 3, windowMs: 300_000 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } }, { status: 429 });
    }

    const { mobile, verificationCode, newPassword } = (await request.json()) as { mobile: string; verificationCode?: string; newPassword: string };

    if (!mobile || !newPassword || !verificationCode) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Mobile number, verification code, and new password are required' } },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Password must be at least 8 characters' } },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const resetDoc = await db.collection('passwordResets').doc(mobile).get();

    if (!resetDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No reset code found. Please request a new code.' } },
        { status: 404 },
      );
    }

    const resetData = resetDoc.data() as { code: string; expiresAt: string; used: boolean };
    if (resetData.used) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_USED', message: 'This reset code has already been used.' } },
        { status: 400 },
      );
    }

    if (new Date(resetData.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'EXPIRED', message: 'Reset code has expired. Please request a new one.' } },
        { status: 400 },
      );
    }

    if (resetData.code !== verificationCode) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Invalid verification code.' } },
        { status: 400 },
      );
    }

    const result = await userService.findUserByMobile(mobile);
    if (!result.ok || !result.value) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No account found.' } },
        { status: 404 },
      );
    }

    const user = result.value;
    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(user.id, { password: newPassword });

    await resetDoc.ref.update({ used: true });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
