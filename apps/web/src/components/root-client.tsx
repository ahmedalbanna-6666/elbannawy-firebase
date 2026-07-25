"use client";

import { useState, useEffect } from "react";
import { SplashScreen } from "./splash-screen";

function registerSw(): void {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});
  }
}

export function RootClient({ children }: { children: React.ReactNode }): React.ReactNode {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    registerSw();
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => { setShowSplash(false); }} />}
      {children}
    </>
  );
}
