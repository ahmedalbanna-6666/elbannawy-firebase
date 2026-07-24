import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import {
  CoinPurchaseRequestRepository,
  CoinPackageRepository,
  UserService,
  NotificationDispatcher,
} from '@el-bannawy/lib';

const requestRepo = new CoinPurchaseRequestRepository();
const coinPackageRepo = new CoinPackageRepository();
const userService = new UserService();
const dispatcher = new NotificationDispatcher();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};
    const isAdmin = searchParams.get('all') === 'true';

    if (!isAdmin) {
      filter.studentId = decoded.uid;
    }

    const status = searchParams.get('status');
    if (status) filter.status = status;

    const result = await requestRepo.list(filter as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

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

    const now = new Date().toISOString();
    const requestId = `cpr_${Date.now()}`;

    const purchaseRequest = {
      id: requestId,
      studentId: decoded.uid,
      packageId,
      packageName: pkg.value.name,
      coinAmount: pkg.value.coinAmount,
      priceMinorUnits: pkg.value.priceMinorUnits,
      currency: pkg.value.currency,
      paymentMethod,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    const result = await requestRepo.create(purchaseRequest as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const userResult = await userService.getUserById(decoded.uid);
    const studentName = userResult.ok && userResult.value ? (userResult.value as any).fullName || 'طالب' : 'طالب';

    await dispatcher.coinPurchaseRequested(decoded.uid, studentName, pkg.value.coinAmount, requestId);

    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
