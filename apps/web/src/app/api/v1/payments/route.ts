import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { PaymentRepository } from '@el-bannawy/lib';

const paymentRepo = new PaymentRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const result = await paymentRepo.listByStudent(decoded.uid);
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

    const now = new Date().toISOString();
    const payment = {
      id: body.id as string || `pay_${Date.now()}`,
      studentId: decoded.uid,
      productType: body.productType as string,
      productId: body.productId as string,
      paymentMethod: (body.paymentMethod as string) || 'PENDING',
      amountMinorUnits: body.amountMinorUnits as number,
      currency: (body.currency as string) || 'EGP',
      status: 'PENDING',
      idempotencyKey: body.idempotencyKey as string || `ik_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const result = await paymentRepo.create(payment as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
