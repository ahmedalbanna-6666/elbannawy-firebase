'use client';

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { ensureClientApp } from './client-auth';

let messagingInstance: Messaging | null = null;

export function getClientMessaging(): Messaging {
  if (messagingInstance) return messagingInstance;
  messagingInstance = getMessaging(ensureClientApp());
  return messagingInstance;
}

export async function requestFcmToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted');
      return null;
    }

    const messaging = getClientMessaging();
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('[FCM] Failed to get token:', error);
    return null;
  }
}

export async function registerFcmToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/notifications/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'web' }),
    });
    return response.ok;
  } catch (error) {
    console.error('[FCM] Failed to register token:', error);
    return false;
  }
}

export function listenForFcmMessages(onMessageCallback: (payload: any) => void): () => void {
  try {
    const messaging = getClientMessaging();
    const unsubscribe = onMessage(messaging, (payload) => {
      onMessageCallback(payload);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}
