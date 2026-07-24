import { FcmNotificationService } from './fcm-notification.service';
import type { INotificationPayload } from '../repositories/contracts';

const fcm = new FcmNotificationService();

export class NotificationDispatcher {
  async coinPurchaseRequested(studentId: string, studentName: string, amount: number, _requestId: string): Promise<void> {
    await this.broadcastToRole('admin', `طلب شراء كوينز`, `الطالب ${studentName} يطلب شراء ${amount} كوينز`, 'coin_purchase_request', `/admin-dashboard/`);

    await fcm.sendToUser({
      userId: studentId,
      title: 'تم إرسال طلب الشراء',
      message: `تم إرسال طلب شراء ${amount} كوينز للمراجعة`,
      type: 'coin_purchase_request',
      priority: 'NORMAL',
      link: `/coins/my-requests`,
    });
  }

  async purchaseApproved(studentId: string, amount: number): Promise<void> {
    await this.sendInAppAndPush(studentId, 'تمت الموافقة على طلب الشراء', `تمت الموافقة على طلب شراء ${amount} كوينز وتم إضافتها إلى محفظتك`, 'coin_purchase_approved', '/shop');
  }

  async purchaseRejected(studentId: string, amount: number, reason?: string): Promise<void> {
    const msg = reason
      ? `تم رفض طلب شراء ${amount} كوينز. السبب: ${reason}`
      : `تم رفض طلب شراء ${amount} كوينز`;
    await this.sendInAppAndPush(studentId, 'تم رفض طلب الشراء', msg, 'coin_purchase_rejected', '/shop');
  }

  async liveSessionCreated(userId: string, title: string, _gradeId: string): Promise<void> {
    await fcm.sendToUser({
      userId,
      title: 'حصّة مباشرة جديدة',
      message: `تم إنشاء حصّة مباشرة: ${title}`,
      type: 'live_session_created',
      priority: 'HIGH',
      link: `/live/sessions`,
    });
  }

  async liveSessionStarted(bookedUserIds: string[], sessionTitle: string, sessionId: string): Promise<void> {
    const payloads: INotificationPayload[] = bookedUserIds.map((uid) => ({
      userId: uid,
      title: 'الحصّة المباشرة بدأت الآن!',
      message: `انضم الآن إلى الحصّة: ${sessionTitle}`,
      type: 'live_session_started',
      priority: 'URGENT',
      link: `/live/sessions/${sessionId}`,
    }));
    await fcm.sendToMultipleUsers(payloads);
  }

  async newLessonAdded(userIds: string[], lessonTitle: string, gradeName: string): Promise<void> {
    const payloads: INotificationPayload[] = userIds.map((uid) => ({
      userId: uid,
      title: 'درس جديد',
      message: `تم إضافة درس جديد: ${lessonTitle} - ${gradeName}`,
      type: 'new_lesson',
      priority: 'NORMAL',
      link: `/curriculum/lessons`,
    }));
    await fcm.sendToMultipleUsers(payloads);
  }

  async weeklySessionReminder(userId: string, title: string, scheduledAt: string): Promise<void> {
    await fcm.sendToUser({
      userId,
      title: 'تذكير بالحصّة الأسبوعية',
      message: `لديك حصّة مسجلة: ${title} في ${new Date(scheduledAt).toLocaleDateString('ar-EG')}`,
      type: 'session_reminder',
      priority: 'NORMAL',
      link: `/live/sessions`,
    });
  }

  async supportTicketReplied(userId: string, ticketId: string, supportName: string): Promise<void> {
    await this.sendInAppAndPush(userId, 'رد من الدعم الفني', `${supportName} قام بالرد على تذكرتك`, 'support_reply', `/support/tickets/${ticketId}`);
  }

  private async sendInAppAndPush(userId: string, title: string, message: string, type: string, link?: string): Promise<void> {
    const payload: INotificationPayload = { userId, title, message, type, priority: 'NORMAL', link };
    await fcm.sendToUser(payload);
  }

  private async broadcastToRole(role: string, title: string, message: string, type: string, link?: string): Promise<void> {
    await fcm.broadcastToRole(role, { title, message, type, priority: 'NORMAL', link });
  }
}
