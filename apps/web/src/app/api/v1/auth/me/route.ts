import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifyIdToken(token);

    const doc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userData: Record<string, unknown> | undefined = doc.data();
    if (!userData) {
      return NextResponse.json({ success: false, message: 'User data is empty' }, { status: 404 });
    }
    const fullName = typeof userData.fullName === 'string' ? userData.fullName : '';
    const mobileNumber = typeof userData.mobileNumber === 'string' ? userData.mobileNumber : null;
    const role = typeof userData.role === 'string' ? userData.role : 'student';
    const status = typeof userData.status === 'string' ? userData.status : 'active';
    const rawPermissions = userData.effectivePermissions;
    const effectivePermissions: string[] = Array.isArray(rawPermissions) ? rawPermissions.filter((p): p is string => typeof p === 'string') : [];

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        fullName,
        mobileNumber,
        role,
        status,
        effectivePermissions,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
}
