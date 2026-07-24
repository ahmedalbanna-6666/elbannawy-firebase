"use client";

import { useState } from "react";
import { SplashScreen } from "./splash-screen";
import { AnimatePresence, motion } from "framer-motion";

export function RootClient({ children }: { children: React.ReactNode }): React.ReactNode {
  const [showSplash, setShowSplash] = useState(true);

  const handleFinish = (): void => {
    setShowSplash(false);
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onFinish={handleFinish} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </>
  );
}
