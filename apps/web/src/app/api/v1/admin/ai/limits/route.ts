import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

const LIMITS_ID = 'ai-limits';

export async function GET(): Promise<NextResponse> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('aiConsumptionLimits').doc(LIMITS_ID).get();
    if (!doc.exists) {
      return NextResponse.json({
        success: true,
        data: {
          studentDailyLimit: 50,
          studentMonthlyLimit: 500,
          studentTokensPerDay: 10000,
          studentTokensPerMonth: 100000,
          teacherDailyLimit: 300,
          teacherMonthlyLimit: 3000,
          limitType: 'messages',
          resetPeriod: 'daily',
          updatedAt: null,
        },
      });
    }
    return NextResponse.json({ success: true, data: doc.data() });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch AI limits' } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const data = {
      ...body,
      updatedAt: now,
    };
    await db.collection('aiConsumptionLimits').doc(LIMITS_ID).set(data, { merge: true });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update AI limits' } }, { status: 500 });
  }
}
