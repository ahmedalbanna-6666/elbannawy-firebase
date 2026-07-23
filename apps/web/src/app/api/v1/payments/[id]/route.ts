import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { PaymentRepository } from '@el-bannawy/lib';

const paymentRepo = new PaymentRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const result = await paymentRepo.getById(id);
    if (!result.ok || !result.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } }, { status: 404 });
    }
    if (result.value.studentId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your payment' } }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
