import { SubscriptionPlanRepository, SubscriptionRepository } from '../../repositories/subscriptions';
import { ContentEntitlementRepository, WalletRepository, CoinTransactionRepository } from '../../repositories/coins';
import { PaymentRepository } from '../../repositories/payments';
import { getFirestoreInstance } from '../../repositories/firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ISubscription, ISubscriptionPlan } from '../../repositories/contracts';

export class SubscriptionService {
  private planRepo = new SubscriptionPlanRepository();
  private subRepo = new SubscriptionRepository();
  private entitlementRepo = new ContentEntitlementRepository();
  private walletRepo = new WalletRepository();
  private coinTxRepo = new CoinTransactionRepository();
  private paymentRepo = new PaymentRepository();

  async createSubscription(
    studentId: string,
    planId: string,
    paymentMethod: string,
    paymentGateway: string,
    paymentId: string | null,
  ): Promise<RepositoryResult<ISubscription>> {
    try {
      const planResult = await this.planRepo.getById(planId);
      if (!planResult.ok || !planResult.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'Subscription plan not found' } };
      }
      const plan = planResult.value;

      const existing = await this.subRepo.getActiveByStudent(studentId);
      if (existing.ok && existing.value) {
        return { ok: false, error: { code: 'CONFLICT', message: 'Student already has an active subscription' } };
      }

      const now = new Date();
      const periodStart = now.toISOString();
      let periodEnd: Date;
      let trialEnd: string | null = null;

      if (plan.trialDays > 0) {
        const trialEndDate = new Date(now.getTime() + plan.trialDays * 86400000);
        trialEnd = trialEndDate.toISOString();
        periodEnd = new Date(trialEndDate.getTime() + this.getIntervalMs(plan.billingInterval, plan.billingIntervalCount));
      } else {
        periodEnd = new Date(now.getTime() + this.getIntervalMs(plan.billingInterval, plan.billingIntervalCount));
      }

      const subscription: ISubscription = {
        id: `sub_${Date.now()}`,
        studentId,
        planId: plan.id,
        planName: plan.name,
        status: plan.trialDays > 0 ? 'TRIAL' : 'ACTIVE',
        billingInterval: plan.billingInterval,
        priceMinorUnits: plan.priceMinorUnits,
        currency: plan.currency,
        trialEndAt: trialEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd.toISOString(),
        nextBillingDate: plan.billingInterval === 'ONE_TIME' ? null : periodEnd.toISOString(),
        cancelledAt: null,
        upgradeFromId: null,
        paymentMethod,
        paymentGateway,
        paymentId,
        entitlementsAutoGranted: false,
        autoRenew: plan.billingInterval !== 'ONE_TIME',
        gracePeriodEnd: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const result = await this.subRepo.create(subscription);
      if (!result.ok) return result;

      if (plan.contentScope !== 'ALL_PREMIUM' && plan.contentIds.length > 0) {
        await this.grantContentEntitlements(studentId, plan, subscription.id, paymentId);
      }

      await this.subRepo.update(subscription.id, { entitlementsAutoGranted: true });

      return result;
    } catch (error) {
      return { ok: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<RepositoryResult<ISubscription>> {
    return this.subRepo.cancel(subscriptionId);
  }

  async renewSubscription(subscriptionId: string): Promise<RepositoryResult<ISubscription>> {
    try {
      const subResult = await this.subRepo.getById(subscriptionId);
      if (!subResult.ok || !subResult.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } };
      }
      const sub = subResult.value;

      if (sub.status !== 'ACTIVE' && sub.status !== 'GRACE') {
        return { ok: false, error: { code: 'PRECONDITION_FAILED', message: 'Subscription is not renewable' } };
      }

      const planResult = await this.planRepo.getById(sub.planId);
      if (!planResult.ok || !planResult.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };
      }

      const now = new Date();
      const intervalMs = this.getIntervalMs(sub.billingInterval, 1);
      const newPeriodEnd = new Date(now.getTime() + intervalMs).toISOString();

      return this.subRepo.update(subscriptionId, {
        status: 'ACTIVE',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: newPeriodEnd,
        nextBillingDate: sub.billingInterval === 'ONE_TIME' ? null : newPeriodEnd,
        gracePeriodEnd: null,
      });
    } catch (error) {
      return { ok: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  async expireSubscription(subscriptionId: string): Promise<RepositoryResult<ISubscription>> {
    try {
      const subResult = await this.subRepo.getById(subscriptionId);
      if (!subResult.ok || !subResult.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } };
      }

      const result = await this.subRepo.update(subscriptionId, { status: 'EXPIRED' });
      if (!result.ok) return result;

      await this.revokeSubscriptionEntitlements(subscriptionId);

      return result;
    } catch (error) {
      return { ok: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  async upgradeSubscription(
    subscriptionId: string,
    newPlanId: string,
    additionalPaymentId: string | null,
  ): Promise<RepositoryResult<ISubscription>> {
    try {
      const subResult = await this.subRepo.getById(subscriptionId);
      if (!subResult.ok || !subResult.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } };
      }
      const current = subResult.value;

      const newPlanResult = await this.planRepo.getById(newPlanId);
      if (!newPlanResult.ok || !newPlanResult.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'New plan not found' } };
      }
      const newPlan = newPlanResult.value;

      const now = new Date();
      const newPeriodEnd = new Date(now.getTime() + this.getIntervalMs(newPlan.billingInterval, newPlan.billingIntervalCount)).toISOString();

      const upgraded: ISubscription = {
        id: `sub_${Date.now()}`,
        studentId: current.studentId,
        planId: newPlan.id,
        planName: newPlan.name,
        status: 'ACTIVE',
        billingInterval: newPlan.billingInterval,
        priceMinorUnits: newPlan.priceMinorUnits,
        currency: newPlan.currency,
        trialEndAt: null,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: newPeriodEnd,
        nextBillingDate: newPlan.billingInterval === 'ONE_TIME' ? null : newPeriodEnd,
        cancelledAt: null,
        upgradeFromId: subscriptionId,
        paymentMethod: current.paymentMethod,
        paymentGateway: current.paymentGateway,
        paymentId: additionalPaymentId,
        entitlementsAutoGranted: false,
        autoRenew: newPlan.billingInterval !== 'ONE_TIME',
        gracePeriodEnd: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await this.subRepo.update(subscriptionId, { status: 'UPGRADED' });

      const result = await this.subRepo.create(upgraded);
      if (!result.ok) return result;

      if (newPlan.contentScope !== 'ALL_PREMIUM' && newPlan.contentIds.length > 0) {
        await this.grantContentEntitlements(current.studentId, newPlan, upgraded.id, additionalPaymentId);
      }

      await this.subRepo.update(upgraded.id, { entitlementsAutoGranted: true });

      return result;
    } catch (error) {
      return { ok: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  async getActiveSubscription(studentId: string): Promise<RepositoryResult<ISubscription | null>> {
    return this.subRepo.getActiveByStudent(studentId);
  }

  async listExpiredSubscriptions(): Promise<RepositoryResult<ISubscription[]>> {
    const expired = await this.subRepo.listExpired();
    return expired;
  }

  async processAutoExpirations(): Promise<RepositoryResult<{ expired: number }>> {
    try {
      const expiredResult = await this.listExpiredSubscriptions();
      if (!expiredResult.ok || !expiredResult.value) {
        return { ok: true, value: { expired: 0 } };
      }

      let count = 0;
      for (const sub of expiredResult.value) {
        if (sub.status === 'ACTIVE' || sub.status === 'GRACE') {
          const gracePeriodMs = 3 * 86400000;
          const periodEnd = new Date(sub.currentPeriodEnd).getTime();
          const now = Date.now();

          if (sub.status === 'ACTIVE' && now > periodEnd && now <= periodEnd + gracePeriodMs) {
            const graceEnd = new Date(periodEnd + gracePeriodMs).toISOString();
            await this.subRepo.update(sub.id, { status: 'GRACE', gracePeriodEnd: graceEnd });
            continue;
          }

          await this.expireSubscription(sub.id);
          count++;
        }
      }

      return { ok: true, value: { expired: count } };
    } catch (error) {
      return { ok: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  private async grantContentEntitlements(
    studentId: string,
    plan: ISubscriptionPlan,
    subscriptionId: string,
    paymentId: string | null,
  ): Promise<void> {
    const now = new Date().toISOString();
    const planInterval = this.getIntervalMs(plan.billingInterval, plan.billingIntervalCount);
    const expiresAt = new Date(Date.now() + planInterval).toISOString();

    for (const contentId of plan.contentIds) {
      const scope = plan.contentScope;
      const contentType = scope === 'FULL_COURSE' || scope === 'ALL_PREMIUM' ? 'UNIT' : scope === 'SPECIFIC_UNITS' ? 'UNIT' : 'LESSON';

      const existing = await this.entitlementRepo.getByStudentAndContent(studentId, contentType, contentId);
      if (existing.ok && existing.value) continue;

      const entitlement = {
        id: `ent_sub_${Date.now()}_${contentId}`,
        studentId,
        contentType,
        contentId,
        sourceType: 'subscription',
        sourceId: subscriptionId,
        paymentId,
        active: true,
        activatedAt: now,
        expiresAt,
      };

      await this.entitlementRepo.create(entitlement as any);
    }
  }

  private async revokeSubscriptionEntitlements(subscriptionId: string): Promise<void> {
    const db = getFirestoreInstance();
    const snap = await db.collection('contentEntitlements')
      .where('sourceType', '==', 'subscription')
      .where('sourceId', '==', subscriptionId)
      .get();

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { active: false });
    });
    await batch.commit();
  }

  private getIntervalMs(interval: string, count: number): number {
    const day = 86400000;
    switch (interval) {
      case 'MONTHLY': return 30 * day * count;
      case 'QUARTERLY': return 90 * day * count;
      case 'SEMI_ANNUAL': return 180 * day * count;
      case 'YEARLY': return 365 * day * count;
      case 'ONE_TIME': return 365 * 10 * day;
      default: return 30 * day;
    }
  }
}
