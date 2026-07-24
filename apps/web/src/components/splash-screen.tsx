"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/providers/theme-provider";

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps): React.ReactNode {
  const { theme } = useTheme();
  const [phase, setPhase] = useState<"enter" | "reveal" | "exit">("enter");
  const [showSplash, setShowSplash] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const delay = (ms: number): Promise<void> =>
      new Promise((r) => {
        const id = setTimeout(() => { if (mountedRef.current) r(undefined); }, ms);
      });
    const run = async (): Promise<void> => {
      await delay(600);
      if (!mountedRef.current) return;
      setPhase("reveal");
      await delay(1200);
      if (!mountedRef.current) return;
      setPhase("exit");
      await delay(500);
      if (mountedRef.current) {
        setShowSplash(false);
        if (onFinish) onFinish();
      }
    };
    run();
    return () => { mountedRef.current = false; };
  }, []);

  if (!showSplash) return null;

  const isDark = theme === "dark";

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9InJnYmEoOTksMTAyLDI0MSwwLjA0KSIgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJNMzYgMzR2LTRoNHY0aC00em0wIDB2LTRoLTR2NGg0em0wIDB2LTRoLTR2NGg0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-blue-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,165,233,0.08)_0%,_transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9InJnYmEoMTQsMTY1LDIzMywwLjA0KSIgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJNMzYgMzR2LTRoNHY0aC00em0wIDB2LTRoLTR2NGg0em0wIDB2LTRoLTR2NGg0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        </>
      )}

      <motion.div
        className="relative"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{
          scale: phase === "exit" ? 0.95 : 1,
          opacity: 1,
        }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="relative w-[200px] sm:w-[260px] md:w-[320px] aspect-[1134/1058]">
          <Image
            src="/logo-splash.svg"
            alt="El-Bannawy"
            fill
            className={`object-contain ${isDark ? "drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]" : "drop-shadow-[0_0_20px_rgba(14,165,233,0.15)]"}`}
            priority
            unoptimized
          />
        </div>

        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phase === "reveal" || phase === "exit" ? 1 : 0, y: phase === "reveal" || phase === "exit" ? 0 : 8 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-emerald-400" : "bg-sky-500"}`}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-emerald-400" : "bg-sky-500"}`}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
          />
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-emerald-400" : "bg-sky-500"}`}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}