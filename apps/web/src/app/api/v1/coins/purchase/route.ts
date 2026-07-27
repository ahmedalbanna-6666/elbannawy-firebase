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

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const packageId = body.packageId as string;
    const paymentMethod = (body.paymentMethod as string) || 'PENDING';

    if (!packageId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'packageId is required' } }, { status: 400 });
    }

    const pkg = await coinPackageRepo.getById(packageId);
    if (!pkg.ok || !pkg.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } }, { status: 404 });
    }
    if (!pkg.value.active) {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Package is not active' } }, { status: 412 });
    }

    const now = new Date().toISOString();
    const idempotencyKey = body.idempotencyKey as string || `pk_${decoded.uid}_${packageId}_${Date.now()}`;

    const existingPayments = await paymentRepo.listByStudent(decoded.uid);
    if (existingPayments.ok) {
      const duplicate = existingPayments.value.find(
        (p) => p.idempotencyKey === idempotencyKey && p.status === 'COMPLETED'
      );
      if (duplicate) {
        return NextResponse.json({ success: true, data: { payment: duplicate, coinsAdded: pkg.value.coinAmount, newBalance: 0, alreadyProcessed: true } }, { status: 200 });
      }
    }

    const paymentId = `pay_${Date.now()}`;
    const payment = {
      id: paymentId,
      studentId: decoded.uid,
      productType: 'coin_package',
      productId: packageId,
      paymentMethod,
      amountMinorUnits: pkg.value.priceMinorUnits,
      currency: pkg.value.currency,
      status: 'COMPLETED',
      idempotencyKey,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const payResult = await paymentRepo.create(payment as any);
    if (!payResult.ok) {
      return NextResponse.json({ success: false, error: payResult.error }, { status: 500 });
    }

    const wallet = await walletRepo.getByStudentId(decoded.uid);
    const currentBalance = wallet.ok && wallet.value ? wallet.value.balance : 0;
    const currentPurchased = wallet.ok && wallet.value ? wallet.value.totalPurchased : 0;

    await walletRepo.upsert(
      decoded.uid,
      currentBalance + pkg.value.coinAmount,
      currentPurchased + pkg.value.coinAmount,
      wallet.ok && wallet.value ? wallet.value.totalEarned : 0,
      wallet.ok && wallet.value ? wallet.value.totalSpent : 0,
      0,
    );

    const tx = {
      id: `ctx_${Date.now()}`,
      studentId: decoded.uid,
      amount: pkg.value.coinAmount,
      transactionType: 'PURCHASE',
      sourceType: 'coin_package',
      sourceId: packageId,
      balanceAfter: currentBalance + pkg.value.coinAmount,
      occurredAt: now,
      idempotencyKey: `ctx_${idempotencyKey}`,
    };

    await coinTxRepo.create(tx as any);

    return NextResponse.json({ success: true, data: { payment: payResult.value, coinsAdded: pkg.value.coinAmount, newBalance: currentBalance + pkg.value.coinAmount } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
