"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { useAuthStore } from "@/lib/auth-store";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function getClientMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  try {
    const { getApp } = require("firebase/app");
    const app = getApp();
    return getMessaging(app);
  } catch {
    return null;
  }
}

export function usePushNotifications(): {
  permission: NotificationPermission | null;
  token: string | null;
  subscribed: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  supported: boolean;
} {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const messagingRef = useRef<Messaging | null>(null);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
    messagingRef.current = getClientMessaging();
  }, []);

  useEffect(() => {
    if (!messagingRef.current || !token || !userId) return;
    const unsubscribe = onMessage(messagingRef.current, (payload) => {
      const title = payload.notification?.title || "إشعار جديد";
      const body = payload.notification?.body || "";

      if (Notification.permission === "granted" && document.visibilityState !== "visible") {
        new Notification(title, {
          body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          dir: "rtl",
          lang: "ar",
        });
      }
    });
    return () => unsubscribe();
  }, [token, userId]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (!("Notification" in window)) return false;
      if (!VAPID_KEY) return false;

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const messaging = getClientMessaging();
      if (!messaging) return false;

      const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (!fcmToken) return false;

      setToken(fcmToken);
      setSubscribed(true);

      const res = await fetch("/api/v1/notifications/device-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fcmToken, platform: "web" }),
      });

      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const messaging = getClientMessaging();
      if (!messaging) return false;

      const { deleteToken } = await import("firebase/messaging");
      await deleteToken(messaging);

      setToken(null);
      setSubscribed(false);

      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    permission: "Notification" in window ? permission : null,
    token,
    subscribed,
    subscribe,
    unsubscribe,
    supported: typeof window !== "undefined" && "Notification" in window && !!VAPID_KEY,
  };
}
