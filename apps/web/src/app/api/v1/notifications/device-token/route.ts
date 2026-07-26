import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    let uid: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const adminAuth = getAdminAuth();
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch {}
    }

    if (!uid) {
      const cookieToken = request.cookies.get('auth_token')?.value;
      if (cookieToken) {
        try {
          const adminAuth = getAdminAuth();
          const decoded = await adminAuth.verifyIdToken(cookieToken);
          uid = decoded.uid;
        } catch {}
      }
    }

    if (!uid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { token?: string; platform?: string };
    const deviceToken = body.token;
    const platform = body.platform || 'web';
    const now = new Date().toISOString();
    const docId = `${uid}_${platform}`;

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Device token is required' } },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const docRef = db.collection('deviceTokens').doc(docId);
    const existing = await docRef.get();

    if (existing.exists) {
      await docRef.update({
        token: deviceToken,
        lastSeenAt: now,
        updatedAt: now,
        active: true,
      });
    } else {
      await docRef.set({
        id: docId,
        userId: uid,
        token: deviceToken,
        platform,
        active: true,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true, data: { id: docId } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to register device token' } },
      { status: 500 },
    );
  }
}
