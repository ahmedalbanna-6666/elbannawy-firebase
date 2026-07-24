import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import { WalletRepository, CoinTransactionRepository, ContentEntitlementRepository } from '@el-bannawy/lib';

const walletRepo = new WalletRepository();
const coinTxRepo = new CoinTransactionRepository();
const entitlementRepo = new ContentEntitlementRepository();

const VALID_CONTENT_TYPES = ['UNIT', 'LESSON'];

async function getContentPrice(contentType: string, contentId: string): Promise<number | null> {
  try {
    const db = getAdminDb();
    let collection: string;
    if (contentType === 'UNIT') {
      collection = 'units';
    } else if (contentType === 'LESSON') {
      collection = 'lessons';
    } else {
      return null;
    }
    const doc = await db.collection(collection).doc(contentId).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (!data.isPremium) return 0;
    return (data.priceCoins as number) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: { contentType?: string; contentId?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const contentType = (body.contentType ?? '').toUpperCase();
    const contentId = (body.contentId ?? '').trim();

    if (!contentType || !contentId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'contentType and contentId are required' } }, { status: 400 });
    }

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: `Invalid contentType. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}` } }, { status: 400 });
    }

    const coinCost = await getContentPrice(contentType, contentId);
    if (coinCost === null) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Content not found' } }, { status: 404 });
    }
    if (coinCost === 0) {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'This content is free and does not require unlocking' } }, { status: 412 });
    }

    const wallet = await walletRepo.getByStudentId(decoded.uid);
    if (!wallet.ok || !wallet.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Wallet not found' } }, { status: 404 });
    }

    if (wallet.value.balance < coinCost) {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Insufficient coins' } }, { status: 412 });
    }

    const existing = await entitlementRepo.getByStudentAndContent(decoded.uid, contentType, contentId);
    if (existing.ok && existing.value) {
      return NextResponse.json({ success: false, error: { code: 'ALREADY_EXISTS', message: 'Already unlocked' } }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newBalance = wallet.value.balance - coinCost;

    await walletRepo.upsert(
      decoded.uid,
      newBalance,
      wallet.value.totalPurchased,
      wallet.value.totalEarned,
      wallet.value.totalSpent + coinCost,
      0,
    );

    const idempotencyKey = `unlock_${contentType}_${contentId}_${decoded.uid}`;
    const tx = {
      id: `ctx_${Date.now()}`,
      studentId: decoded.uid,
      amount: -coinCost,
      transactionType: 'SPEND',
      sourceType: contentType,
      sourceId: contentId,
      balanceAfter: newBalance,
      occurredAt: now,
      idempotencyKey,
    };

    await coinTxRepo.create(tx as any);

    const entitlement = {
      id: `ent_${Date.now()}`,
      studentId: decoded.uid,
      contentType,
      contentId,
      sourceType: 'coin_unlock',
      sourceId: `ctx_${Date.now()}`,
      active: true,
      activatedAt: now,
    };

    const entResult = await entitlementRepo.create(entitlement as any);
    if (!entResult.ok) {
      return NextResponse.json({ success: false, error: entResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { entitlement: entResult.value, coinsSpent: coinCost, newBalance } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
