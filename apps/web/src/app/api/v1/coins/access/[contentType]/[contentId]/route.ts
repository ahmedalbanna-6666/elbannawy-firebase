import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import { ContentEntitlementRepository } from '@el-bannawy/lib';

const entitlementRepo = new ContentEntitlementRepository();

const VALID_TYPES = ['UNIT', 'LESSON'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentType: string; contentId: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { contentType, contentId } = await params;
    const type = contentType.toUpperCase();

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: `Invalid contentType. Must be one of: ${VALID_TYPES.join(', ')}` } }, { status: 400 });
    }

    if (!contentId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'contentId is required' } }, { status: 400 });
    }

    const db = getAdminDb();
    const collection = type === 'UNIT' ? 'units' : 'lessons';
    const contentDoc = await db.collection(collection).doc(contentId).get();
    if (!contentDoc.exists) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Content not found' } }, { status: 404 });
    }

    const contentData = contentDoc.data()!;
    const isPremium = contentData.isPremium === true;
    const priceCoins = (contentData.priceCoins as number) ?? (isPremium ? 50 : 0);

    if (!isPremium) {
      return NextResponse.json({ success: true, data: { unlocked: true, isPremium: false, priceCoins: 0 } });
    }

    const entitlement = await entitlementRepo.getByStudentAndContent(decoded.uid, type, contentId);
    const unlocked = entitlement.ok && entitlement.value !== null;

    return NextResponse.json({ success: true, data: { unlocked, isPremium, priceCoins } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
