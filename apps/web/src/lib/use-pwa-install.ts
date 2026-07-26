"use client";

import { useState, useEffect, useCallback } from "react";

const LS_KEY = "el-bannawy-pwa-dismissed";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone?: boolean }).standalone === true)
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function usePwaInstall(): {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
  dismissed: boolean;
} {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(LS_KEY) === "true") return;

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

  const install = useCallback(async (): Promise<void> => {
    if (deferredPrompt) {
      (deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt();
      const result = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
      if (result.outcome === "accepted") {
        localStorage.setItem(LS_KEY, "true");
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos()) {
      localStorage.setItem(LS_KEY, "true");
      setDismissed(true);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback((): void => {
    localStorage.setItem(LS_KEY, "true");
    setDismissed(true);
  }, []);

  return {
    canInstall: !!deferredPrompt || isIos(),
    isStandalone: isStandalone(),
    isIos: isIos(),
    install,
    dismiss,
    dismissed,
  };
}
