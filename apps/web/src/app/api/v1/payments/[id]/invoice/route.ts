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

    const payment = await paymentRepo.getById(id);
    if (!payment.ok || !payment.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } }, { status: 404 });
    }
    if (payment.value.studentId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your payment' } }, { status: 403 });
    }

    const invoices = await paymentRepo.getInvoicesByStudent(decoded.uid);
    if (!invoices.ok) {
      return NextResponse.json({ success: false, error: invoices.error }, { status: 500 });
    }

    const invoice = invoices.value.find((inv) => inv.paymentId === id) || null;
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
