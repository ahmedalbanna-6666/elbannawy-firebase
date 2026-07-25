"use client";

import { useState } from "react";
import { SplashScreen } from "./splash-screen";

export function RootClient({ children }: { children: React.ReactNode }): React.ReactNode {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => { setShowSplash(false); }} />;
  }

  return <>{children}</>;
}
