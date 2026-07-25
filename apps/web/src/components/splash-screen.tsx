"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useTheme } from "@/providers/theme-provider";

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps): React.ReactNode {
  const { theme } = useTheme();
  const [fadeOut, setFadeOut] = useState(false);
  const mountedRef = useRef(true);

  const finish = useCallback((): void => {
    setFadeOut(true);
    setTimeout(() => { if (mountedRef.current) onFinish?.(); }, 300);
  }, [onFinish]);

  useEffect(() => {
    mountedRef.current = true;
    const id = setTimeout(() => { if (mountedRef.current) finish(); }, 500);
    return (): void => { mountedRef.current = false; clearTimeout(id); };
  }, [finish]);

  const isDark = theme === "dark";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
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

      <div
        className="relative cursor-pointer animate-[scale-in_0.5s_ease]"
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
      </div>

      <button
        onClick={finish}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors underline underline-offset-2"
      >
        تخطي
      </button>
    </div>
  );
}