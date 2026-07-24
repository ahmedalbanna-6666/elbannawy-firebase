import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { SubscriptionRepository, SubscriptionPlanRepository } from '@el-bannawy/lib';

const subRepo = new SubscriptionRepository();
const planRepo = new SubscriptionPlanRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const expiringWithin = searchParams.get('expiringWithin');

    if (studentId) {
      const result = await subRepo.listByStudent(studentId);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      return NextResponse.json({ success: true, data: result.value });
    }

    if (expiringWithin) {
      const days = parseInt(expiringWithin, 10);
      const result = await subRepo.listExpiring(isNaN(days) ? 7 : days);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      return NextResponse.json({ success: true, data: result.value });
    }

    if (status === 'expired') {
      const result = await subRepo.listExpired();
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      return NextResponse.json({ success: true, data: result.value });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Provide studentId, expiringWithin, or status=expired' } }, { status: 400 });
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

    let body: { studentId?: string; planId?: string; paymentMethod?: string; action?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    if (body.action === 'create' || !body.action) {
      if (!body.studentId || !body.planId) {
        return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'studentId and planId are required' } }, { status: 400 });
      }

      const planResult = await planRepo.getById(body.planId);
      if (!planResult.ok || !planResult.value) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } }, { status: 404 });
      }

      const now = new Date().toISOString();
      const plan = planResult.value;
      const subscription = {
        id: `sub_${Date.now()}`,
        studentId: body.studentId,
        planId: plan.id,
        planName: plan.name,
        status: 'ACTIVE' as const,
        billingInterval: plan.billingInterval,
        priceMinorUnits: plan.priceMinorUnits,
        currency: plan.currency,
        trialEndAt: null,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        nextBillingDate: plan.billingInterval === 'ONE_TIME' ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
        cancelledAt: null,
        upgradeFromId: null,
        paymentMethod: body.paymentMethod || 'manual',
        paymentGateway: 'manual',
        paymentId: null,
        entitlementsAutoGranted: false,
        autoRenew: plan.billingInterval !== 'ONE_TIME',
        gracePeriodEnd: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await subRepo.create(subscription as any);
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: result.value }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Unknown action' } }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
