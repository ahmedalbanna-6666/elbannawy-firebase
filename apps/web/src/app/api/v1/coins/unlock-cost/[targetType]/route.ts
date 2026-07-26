import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';

const COLLECTION = 'unlockCosts';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ targetType: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { targetType } = await params;
    const type = targetType.toUpperCase();

    const db = getAdminDb();
    const doc = await db.collection(COLLECTION).doc(type).get();

    if (!doc.exists) {
      const defaultCost = type === 'UNIT' ? 50 : 25;
      return NextResponse.json({ success: true, data: { cost: defaultCost } });
    }

    const data = doc.data()!;
    return NextResponse.json({ success: true, data: { cost: (data.cost as number) ?? 50 } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
