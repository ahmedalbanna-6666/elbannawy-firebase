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

    const code = body.code as string;
    const contentType = body.contentType as string;
    const contentId = body.contentId as string;

    if (!code) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'code is required' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const entitlement = {
      id: `ent_${Date.now()}`,
      studentId: decoded.uid,
      contentType: contentType || 'premium_content',
      contentId: contentId || code,
      sourceType: 'redeem_code',
      sourceId: code,
      active: true,
      activatedAt: now,
    };

    const entResult = await entitlementRepo.create(entitlement as any);
    if (!entResult.ok) {
      return NextResponse.json({ success: false, error: entResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: entResult.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
