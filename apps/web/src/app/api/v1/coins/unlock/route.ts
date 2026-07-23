import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { WalletRepository, CoinTransactionRepository, ContentEntitlementRepository } from '@el-bannawy/lib';

const walletRepo = new WalletRepository();
const coinTxRepo = new CoinTransactionRepository();
const entitlementRepo = new ContentEntitlementRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const coinCost = body.coinCost as number;
    const contentType = body.contentType as string;
    const contentId = body.contentId as string;

    if (!coinCost || !contentType || !contentId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'coinCost, contentType, and contentId are required' } }, { status: 400 });
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

    const tx = {
      id: `ctx_${Date.now()}`,
      studentId: decoded.uid,
      amount: -coinCost,
      transactionType: 'SPEND',
      sourceType: contentType,
      sourceId: contentId,
      balanceAfter: newBalance,
      occurredAt: now,
      idempotencyKey: `unlock_${contentType}_${contentId}_${decoded.uid}_${Date.now()}`,
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
