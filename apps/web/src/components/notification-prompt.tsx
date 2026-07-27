"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications } from "@/lib/use-push-notifications";

const LS_KEY = "el-bannawy-notification-dismissed";

export function NotificationPrompt(): ReactNode {
  const { supported, subscribed, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!supported) return;
    if (subscribed) return;
    if (permission === "denied") return;
    if (localStorage.getItem(LS_KEY) === "true") return;
    setDismissed(false);
  }, [supported, subscribed, permission]);

  if (dismissed || !supported || subscribed || permission === "granted" || permission === "denied") return null;

  const handleEnable = async (): Promise<void> => {
    const ok = await subscribe();
    if (ok) {
      localStorage.setItem(LS_KEY, "true");
      setDismissed(true);
    }
  };

  const handleDismiss = (): void => {
    localStorage.setItem(LS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px)+8px+60px)] left-4 right-4 z-50 lg:bottom-6 lg:left-auto lg:ltr:right-6 lg:rtl:left-6 lg:w-96">
      <div className="flex items-start gap-3 rounded-2xl border border-primary-500/20 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-lg dark:bg-neutral-900/95">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
          <BellOff className="h-5 w-5 text-primary-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-100">فعّل الإشعارات</p>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">
            استلم إشعارات فورية للدروس الجديدة والواجبات والتقييمات
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="xs" className="shrink-0 gap-1.5" onClick={handleEnable}>
              <Bell className="h-3.5 w-3.5" />
              تفعيل الإشعارات
            </Button>
            <button
              onClick={handleDismiss}
              className="flex shrink-0 items-center justify-center rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            >
              لاحقاً
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex shrink-0 items-center justify-center rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          aria-label="تجاهل"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
