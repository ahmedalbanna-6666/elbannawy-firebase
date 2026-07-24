import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { WalletRepository, CoinTransactionRepository, ContentEntitlementRepository, CouponRepository } from '@el-bannawy/lib';

const walletRepo = new WalletRepository();
const coinTxRepo = new CoinTransactionRepository();
const entitlementRepo = new ContentEntitlementRepository();
const couponRepo = new CouponRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: { code?: string; contentType?: string; contentId?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const code = (body.code ?? '').trim();
    const contentType = body.contentType as string;
    const contentId = body.contentId as string;

    if (!code) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'code is required' } }, { status: 400 });
    }

    const couponResult = await couponRepo.getByCode(code);
    if (!couponResult.ok || !couponResult.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Invalid or expired redeem code' } }, { status: 404 });
    }

    const coupon = couponResult.value;

    if (!coupon.active) {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Redeem code is no longer active' } }, { status: 412 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Redeem code has expired' } }, { status: 412 });
    }

    if (coupon.maxUses > 0 && coupon.useCount >= coupon.maxUses) {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Redeem code has reached maximum uses' } }, { status: 412 });
    }

    const existingEntitlement = await entitlementRepo.getByStudentAndContent(decoded.uid, coupon.contentType, coupon.contentId);
    if (existingEntitlement.ok && existingEntitlement.value) {
      return NextResponse.json({ success: false, error: { code: 'ALREADY_EXISTS', message: 'Content already unlocked' } }, { status: 409 });
    }

    const now = new Date().toISOString();
    const entitlement = {
      id: `ent_${Date.now()}`,
      studentId: decoded.uid,
      contentType: coupon.contentType,
      contentId: coupon.contentId,
      sourceType: 'redeem_code',
      sourceId: code,
      active: true,
      activatedAt: now,
    };

    const entResult = await entitlementRepo.create(entitlement as any);
    if (!entResult.ok) {
      return NextResponse.json({ success: false, error: entResult.error }, { status: 500 });
    }

    await couponRepo.incrementUseCount(coupon.id);

    return NextResponse.json({ success: true, data: entResult.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
