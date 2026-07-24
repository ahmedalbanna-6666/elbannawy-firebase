import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  CoinPurchaseRequestRepository,
  WalletRepository,
  CoinTransactionRepository,
  NotificationDispatcher,
} from '@el-bannawy/lib';

const requestRepo = new CoinPurchaseRequestRepository();
const walletRepo = new WalletRepository();
const coinTxRepo = new CoinTransactionRepository();
const dispatcher = new NotificationDispatcher();

function mapErrorCode(code: string): number {
  switch (code) {
    case 'NOT_FOUND': return 404;
    case 'FORBIDDEN': return 403;
    case 'INVALID_INPUT': return 400;
    default: return 500;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;
    const result = await requestRepo.getById(id);
    if (!result.ok || !result.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role = (userDoc.data() as { role?: string })?.role ?? 'student';
    if (role !== 'teacher' && role !== 'administrator') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only teachers and admins can review requests' } }, { status: 403 });
    }

    const { id } = await params;

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const status = body.status as string;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'status must be APPROVED or REJECTED' } }, { status: 400 });
    }

    const existing = await requestRepo.getById(id);
    if (!existing.ok || !existing.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } }, { status: 404 });
    }

    if (existing.value.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Request already reviewed' } }, { status: 412 });
    }

    const now = new Date().toISOString();
    const adminNote = body.adminNote as string | undefined;

    await requestRepo.update(id, {
      status: status as any,
      reviewedBy: decoded.uid,
      reviewedAt: now,
      adminNote: adminNote || '',
    } as any);

    if (status === 'APPROVED') {
      const wallet = await walletRepo.getByStudentId(existing.value.studentId);
      const currentBalance = wallet.ok && wallet.value ? wallet.value.balance : 0;
      const currentPurchased = wallet.ok && wallet.value ? wallet.value.totalPurchased : 0;

      await walletRepo.upsert(
        existing.value.studentId,
        currentBalance + existing.value.coinAmount,
        currentPurchased + existing.value.coinAmount,
        wallet.ok && wallet.value ? wallet.value.totalEarned : 0,
        wallet.ok && wallet.value ? wallet.value.totalSpent : 0,
        0,
      );

      const tx = {
        id: `ctx_${Date.now()}`,
        studentId: existing.value.studentId,
        amount: existing.value.coinAmount,
        transactionType: 'PURCHASE',
        sourceType: 'purchase_request',
        sourceId: id,
        balanceAfter: currentBalance + existing.value.coinAmount,
        occurredAt: now,
        idempotencyKey: `ctx_cpr_${id}`,
      };

      await coinTxRepo.create(tx as any);
    }

    if (status === 'APPROVED') {
      await dispatcher.purchaseApproved(existing.value.studentId, existing.value.coinAmount);
    } else {
      await dispatcher.purchaseRejected(existing.value.studentId, existing.value.coinAmount, adminNote);
    }

    return NextResponse.json({ success: true, data: { id, status } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
