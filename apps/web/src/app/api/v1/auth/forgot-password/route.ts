import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/lib/rate-limiter';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateCheck = checkRateLimit(`auth:forgot-password:${ip}`, { maxRequests: 3, windowMs: 300_000 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } }, { status: 429 });
    }

    const { mobile } = (await request.json()) as { mobile: string };
    if (!mobile) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Mobile and password are required' } },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const code = generateCode();
    await db.collection('passwordResets').doc(mobile).set({
      code,
      mobile,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });

    console.log(`[RESET CODE] ${mobile}: ${code}`);

    return NextResponse.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
