import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { normalizeRole } from '@/lib/firebase/auth-helper';
import { UserService } from '@el-bannawy/lib';

const userService = new UserService();

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';

async function verifyToken(token: string): Promise<{ uid: string; email?: string; displayName?: string } | null> {
  // Try Admin SDK verifyIdToken first (works for securetoken.google.com tokens)
  const adminAuth = getAdminAuth();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {}

  // Fallback: use Identity Toolkit lookup API (handles identitytoolkit.google.com tokens)
  try {
    const https = await import('https');
    const result = await new Promise<{ ok: boolean; data: unknown }>((resolve) => {
      const req = https.request({
        hostname: 'identitytoolkit.googleapis.com',
        path: '/v1/accounts:lookup?key=' + FIREBASE_API_KEY,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ ok: res.statusCode === 200, data: JSON.parse(d) }); }
          catch { resolve({ ok: false, data: d }); }
        });
      });
      req.on('error', (e) => resolve({ ok: false, data: e.message }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, data: { error: { message: 'Timed out' } } }); });
      req.write(JSON.stringify({ idToken: token }));
      req.end();
    });
    if (result.ok) {
      const lookupData = result.data as { users?: Array<{ localId: string; email?: string; displayName?: string }> };
      const userInfo = lookupData.users?.[0];
      if (userInfo) {
        return { uid: userInfo.localId, email: userInfo.email, displayName: userInfo.displayName };
      }
    }
  } catch {}

  return null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Try cookie first, then Authorization header
    let token = request.cookies.get('auth_token')?.value;
    const authHeader = request.headers.get('Authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No auth token found' } },
        { status: 401 },
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        { status: 401 },
      );
    }

    const result = await userService.getUserById(decoded.uid);

    if (!result.ok) {
      const adminAuth = getAdminAuth();
      const firebaseUser = await adminAuth.getUser(decoded.uid).catch(() => null);
      if (firebaseUser) {
        const claims = firebaseUser.customClaims ?? {};
        return NextResponse.json({
          success: true,
          data: {
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName ?? 'User',
            mobileNumber: firebaseUser.email?.replace('@el-bannawy.app', '') ?? null,
            role: normalizeRole((claims as Record<string, string>).role ?? 'student'),
            status: 'active',
            effectivePermissions: [],
          },
        });
      }
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 },
      );
    }

    const user = result.value;

    const adminDb = getAdminDb();
    let effectivePermissions: string[] | undefined;
    try {
      const permDoc = await adminDb.collection('userPermissions').doc(user.id).get();
      if (permDoc.exists) {
        effectivePermissions = (permDoc.data() as { permissions?: string[] })?.permissions;
      }
    } catch {
      // permissions lookup failed silently
    }

    const responseData: Record<string, unknown> = {
      id: user.id,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      role: normalizeRole(user.role),
      status: 'active',
    };
    if (effectivePermissions) {
      responseData.effectivePermissions = effectivePermissions;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected error occurred';
    console.error('/api/v1/auth/me error:', msg, e instanceof Error ? e.stack : '');
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: msg } },
      { status: 500 },
    );
  }
}
