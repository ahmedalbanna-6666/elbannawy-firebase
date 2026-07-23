import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { UserService } from '@el-bannawy/lib';

const userService = new UserService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);

    const result = await userService.getUserById(decoded.uid);

    if (!result.ok) {
      const firebaseUser = await adminAuth.getUser(decoded.uid).catch(() => null);
      if (firebaseUser) {
        const claims = firebaseUser.customClaims ?? {};
        return NextResponse.json({
          success: true,
          data: {
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName ?? 'User',
            mobileNumber: firebaseUser.email?.replace('@el-bannawy.app', '') ?? null,
            role: (claims as Record<string, string>).role ?? 'student',
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

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
        status: 'active',
        effectivePermissions: [],
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
      { status: 401 },
    );
  }
}
