import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { PaymentRepository, CoinPackageRepository, WalletRepository, CoinTransactionRepository } from '@el-bannawy/lib';

const paymentRepo = new PaymentRepository();
const coinPackageRepo = new CoinPackageRepository();
const walletRepo = new WalletRepository();
const coinTxRepo = new CoinTransactionRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: { checkoutId?: string; paymentMethod?: string; gatewayRef?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const checkoutId = body.checkoutId ?? '';
    if (!checkoutId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'checkoutId is required' } }, { status: 400 });
    }

    const paymentResult = await paymentRepo.getById(checkoutId);
    if (!paymentResult.ok || !paymentResult.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } }, { status: 404 });
    }

    const payment = paymentResult.value;

    if (payment.status === 'COMPLETED') {
      return NextResponse.json({ success: true, data: { verified: true, status: 'COMPLETED', coinsAdded: 0 } });
    }

    const pkgResult = await coinPackageRepo.getById(payment.productId);
    const coinAmount = pkgResult.ok && pkgResult.value ? pkgResult.value.coinAmount : 0;

    const updateResult = await paymentRepo.updateStatus(checkoutId, 'COMPLETED');
    if (!updateResult.ok) {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 500 });
    }

    const wallet = await walletRepo.getByStudentId(decoded.uid);
    const currentBalance = wallet.ok && wallet.value ? wallet.value.balance : 0;
    const currentPurchased = wallet.ok && wallet.value ? wallet.value.totalPurchased : 0;

    await walletRepo.upsert(
      decoded.uid,
      currentBalance + coinAmount,
      currentPurchased + coinAmount,
      wallet.ok && wallet.value ? wallet.value.totalEarned : 0,
      wallet.ok && wallet.value ? wallet.value.totalSpent : 0,
      0,
    );

    const now = new Date().toISOString();
    const tx = {
      id: `ctx_${Date.now()}`,
      studentId: decoded.uid,
      amount: coinAmount,
      transactionType: 'PURCHASE' as const,
      sourceType: 'coin_package',
      sourceId: checkoutId,
      balanceAfter: currentBalance + coinAmount,
      occurredAt: now,
      idempotencyKey: `ctx_verify_${checkoutId}`,
    };

    await coinTxRepo.create(tx as any);

    return NextResponse.json({ success: true, data: { verified: true, status: 'COMPLETED', coinsAdded: coinAmount } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
