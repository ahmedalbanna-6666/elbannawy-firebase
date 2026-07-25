import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { getFirestoreInstance } from '../repositories/firestore/firestore.service';
import { DeviceTokenRepository } from '../repositories/notifications/device-token.repository';
import { NotificationRepository } from '../repositories/notifications/notification.repository';
import type { INotificationPayload } from '../repositories/contracts';

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging {
  if (messagingInstance) return messagingInstance;
  const apps = getApps();
  let app = apps.length > 0 ? apps[0] : null;
  if (!app) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (clientEmail && privateKey && projectId) {
      privateKey = privateKey.replace(/^["']|["']$/g, '');
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      throw new Error(
        'Firebase Admin SDK not configured for FCM. Set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID.'
      );
    }
  }
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export class FcmNotificationService {
  private deviceTokenRepo = new DeviceTokenRepository();
  private notificationRepo = new NotificationRepository();

  async sendToUser(payload: INotificationPayload): Promise<void> {
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      const inApp = {
        id: notifId,
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority,
        link: payload.link,
        read: false,
        createdAt: now,
        updatedAt: now,
      };

      await this.notificationRepo.create(inApp as any);

      await this.sendFcmToUser(payload.userId, {
        title: payload.title,
        body: payload.message,
        data: {
          type: payload.type,
          link: payload.link || '',
          priority: payload.priority,
          notificationId: notifId,
          ...(payload.data || {}),
        },
      });
    } catch (error) {
      console.error('[FCM] Failed to send notification:', error);
    }
  }

  async sendToMultipleUsers(payloads: INotificationPayload[]): Promise<void> {
    await Promise.allSettled(payloads.map((p) => this.sendToUser(p)));
  }

  async broadcastToRole(role: string, payload: Omit<INotificationPayload, 'userId'>): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const snap = await db.collection('users').where('role', '==', role).get();
      const payloads: INotificationPayload[] = snap.docs.map((doc) => ({
        ...payload,
        userId: doc.id,
      }));
      await this.sendToMultipleUsers(payloads);
    } catch (error) {
      console.error('[FCM] Failed to broadcast to role:', error);
    }
  }

  private async sendFcmToUser(userId: string, message: { title: string; body: string; data: Record<string, string> }): Promise<void> {
    try {
      const tokens = await this.deviceTokenRepo.list({ userId, active: true });
      if (!tokens.ok || tokens.value.length === 0) return;

      const fcmTokens = tokens.value.map((t) => t.token);
      const messaging = getMessagingInstance();

      const responses = await messaging.sendEach(
        fcmTokens.map((token) => ({
          token,
          notification: { title: message.title, body: message.body },
          data: message.data,
        }))
      );

      for (let i = 0; i < responses.responses.length; i++) {
        const resp = responses.responses[i];
        const err = resp?.error;
        if (err?.code === 'registration-token-not-registered' || err?.code === 'invalid-registration-token') {
          const badToken = fcmTokens[i];
          if (badToken) {
            await this.deviceTokenRepo.deactivateByToken(badToken);
          }
        }
      }
    } catch (error) {
      console.error('[FCM] FCM send error:', error);
    }
  }
}
