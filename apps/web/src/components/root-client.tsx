"use client";

import { useEffect, type ReactNode } from "react";

export function RootClient({ children }: { children: React.ReactNode }): ReactNode {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
