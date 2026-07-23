import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CoinPackageRepository, UserService } from '@el-bannawy/lib';

const coinPackageRepo = new CoinPackageRepository();
const userService = new UserService();

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const result = await coinPackageRepo.listActive();
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

    const caller = await userService.getUserById(decoded.uid);
    if (!caller.ok || (caller.value.role !== 'administrator')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const pkg = {
      id: body.id as string || `pkg_${Date.now()}`,
      name: body.name as string,
      description: body.description as string | undefined,
      coinAmount: body.coinAmount as number,
      priceMinorUnits: body.priceMinorUnits as number,
      currency: (body.currency as string) || 'EGP',
      active: body.active !== false,
      displayOrder: (body.displayOrder as number) || 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await coinPackageRepo.create(pkg as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
