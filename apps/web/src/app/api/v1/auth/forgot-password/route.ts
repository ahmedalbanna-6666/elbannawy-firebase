import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { mobile } = (await request.json()) as { mobile: string };
    if (!mobile) {
      return NextResponse.json({ success: false, message: 'Mobile number is required' }, { status: 400 });
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
    const email = userDoc.data().email as string | undefined;

    if (email) {
      const adminAuth = getAdminAuth();
      await adminAuth.generatePasswordResetLink(email);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this mobile number, a verification code has been sent.',
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
