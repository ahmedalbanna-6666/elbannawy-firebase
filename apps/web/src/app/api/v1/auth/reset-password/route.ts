import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
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

    const { mobile, newPassword } = (await request.json()) as { mobile: string; newPassword: string };

    if (!mobile || !newPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Mobile number and new password are required' } },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Password must be at least 8 characters' } },
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
    await adminAuth.updateUser(user.id, { password: newPassword });

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
