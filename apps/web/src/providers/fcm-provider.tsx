'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useFcmToken } from '@/hooks/use-fcm-token';
import { listenForFcmMessages } from '@/lib/firebase/messaging';

interface AuthUser {
  id: string;
}

interface FcmProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export function FcmProvider({ children, isAuthenticated, user }: FcmProviderProps): ReactNode {
  const { setupFcm } = useFcmToken();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!isAuthenticated) return;
    const unregister = listenForFcmMessages((payload) => {
      console.log('[FCM] Foreground message received:', payload);
    });
    return () => {
      unregister();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      setupFcm();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, setupFcm, user?.id]);

  return <>{children}</>;
}
