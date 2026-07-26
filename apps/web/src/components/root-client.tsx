"use client";

import { useEffect, type ReactNode } from "react";

function registerSw(): void {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});
  }
}

export function RootClient({ children }: { children: React.ReactNode }): ReactNode {
  useEffect(() => {
    registerSw();
  }, []);

  return <>{children}</>;
}
