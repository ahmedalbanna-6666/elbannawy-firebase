"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const LS_KEY = "el-bannawy-pwa-installed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as unknown as { standalone?: boolean }).standalone === true);
}

export function PwaInstallPrompt(): ReactNode {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(LS_KEY) === "true") {
      return;
    }

    setDismissed(false);

    const handler = (e: Event): void => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async (): Promise<void> => {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt();
    const result = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
    if (result.outcome === "accepted") {
      localStorage.setItem(LS_KEY, "true");
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = (): void => {
    localStorage.setItem(LS_KEY, "true");
    setDismissed(true);
  };

  if (dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96">
      <div className="flex items-center gap-3 rounded-2xl border border-primary-500/20 bg-neutral-900/95 px-4 py-3 shadow-2xl backdrop-blur-lg dark:bg-neutral-900/95">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
          <Download className="h-5 w-5 text-primary-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-100">ثبّت المنصة</p>
          <p className="text-xs text-neutral-400">حمّل المنصة كتطبيق على جهازك لسهولة الوصول</p>
        </div>
        <Button size="xs" className="shrink-0" onClick={handleInstall}>
          تثبيت
        </Button>
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
