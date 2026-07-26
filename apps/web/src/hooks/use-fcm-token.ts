import { useState, useCallback } from 'react';
import { requestFcmToken, registerFcmToken } from '@/lib/firebase/messaging';

export function useFcmToken() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  const setupFcm = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setLoading(true);
    try {
      const fcmToken = await requestFcmToken();
      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');
        await registerFcmToken(fcmToken);
      } else {
        setPermission(Notification.permission);
      }
    } catch {
      setPermission('denied');
    } finally {
      setLoading(false);
    }
  }, []);

  return { token, permission, loading, setupFcm };
}
