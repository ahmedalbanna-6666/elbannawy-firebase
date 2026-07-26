import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { normalizeRole } from '@/lib/firebase/auth-helper';
import { checkRateLimit } from '@/lib/rate-limiter';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateCheck = checkRateLimit(`auth:sign-in:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } }, { status: 429 });
    }

    const { email, password } = (await request.json()) as Record<string, string>;
    if (!email || !password) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password required' } }, { status: 400 });
    }

    const https = await import('https');
    const qs = 'grant_type=password&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&key=' + FIREBASE_API_KEY;

    const result = await new Promise<{ ok: boolean; data: unknown }>((resolve) => {
      const req = https.request({
        hostname: 'identitytoolkit.googleapis.com',
        path: '/v1/accounts:signInWithPassword?key=' + FIREBASE_API_KEY,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ ok: res.statusCode === 200, data: JSON.parse(d) }); }
          catch { resolve({ ok: false, data: d }); }
        });
      });
      req.on('error', (e) => resolve({ ok: false, data: e.message }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, data: { error: { message: 'Request timed out' } } }); });
      req.write(qs);
      req.end();
    });

    if (!result.ok || !result.data) {
      const errData = result.data as { error?: { message?: string } };
      return NextResponse.json({ success: false, error: { code: 'AUTH_FAILED', message: errData?.error?.message || 'Authentication failed' } }, { status: 401 });
    }

    const data = result.data as { idToken: string; localId: string; email: string; displayName?: string };
    const adminAuth = getAdminAuth();
    const userRecord = await adminAuth.getUser(data.localId);
    const claims = userRecord.customClaims ?? {};
    const rawRole = (claims as Record<string, string>).role ?? 'student';
    const role = normalizeRole(rawRole);

    const response = NextResponse.json({
      success: true,
      token: data.idToken,
      user: {
        id: data.localId,
        email: data.email,
        fullName: data.displayName || userRecord.displayName || 'User',
        role,
        status: 'active',
      },
    });

    return response;
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: e instanceof Error ? e.message : 'Sign-in failed' } }, { status: 500 });
  }
}
