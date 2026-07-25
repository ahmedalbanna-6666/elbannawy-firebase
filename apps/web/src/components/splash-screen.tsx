"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/providers/theme-provider";

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps): React.ReactNode {
  const { theme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const mountedRef = useRef(true);

  const finish = useCallback((): void => {
    setShowSplash(false);
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    mountedRef.current = true;
    const id = setTimeout(() => {
      if (mountedRef.current) finish();
    }, 800);
    return (): void => {
      mountedRef.current = false;
      clearTimeout(id);
    };
  }, [finish]);

  if (!showSplash) return null;

  const isDark = theme === "dark";

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-blue-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,165,233,0.08)_0%,_transparent_70%)]" />
        </>
      )}

      <motion.div
        className="relative cursor-pointer"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        onClick={finish}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") finish(); }}
      >
        <div className="relative w-[180px] sm:w-[240px] aspect-[1134/1058]">
          <Image
            src="/logo-splash.svg"
            alt="El-Bannawy"
            fill
            className={`object-contain ${isDark ? "drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]" : "drop-shadow-[0_0_20px_rgba(14,165,233,0.15)]"}`}
            priority
            unoptimized
          />
        </div>
      </motion.div>

      <button
        onClick={finish}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors underline underline-offset-2"
      >
        تخطي
      </button>
    </motion.div>
  );
}