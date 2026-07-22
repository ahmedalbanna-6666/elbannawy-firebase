import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { mobile, newPassword } = (await request.json()) as { mobile: string; verificationCode: string; newPassword: string };

    if (!mobile || !newPassword) {
      return NextResponse.json({ success: false, message: 'Mobile number and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const usersSnapshot = await adminDb
      .collection('users')
      .where('mobileNumber', '==', mobile)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ success: false, message: 'No account found with this mobile number' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    const uid = userDoc.id;
    const email = userDoc.data().email as string | undefined;

    const adminAuth = getAdminAuth();

    if (email) {
      await adminAuth.updateUser(uid, { password: newPassword });
    } else {
      await adminAuth.updateUser(uid, { password: newPassword });
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
