"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  onFinish?: () => void;
}

interface PathPoint {
  x: number;
  y: number;
  angle: number;
}

const PEN_PATH: { x: number; y: number }[] = [
  { x: 88, y: 18 }, { x: 86, y: 20 }, { x: 84, y: 22 }, { x: 82, y: 24 },
  { x: 80, y: 26 }, { x: 78, y: 28 }, { x: 76, y: 28 }, { x: 74, y: 28 },
  { x: 72, y: 28 }, { x: 70, y: 28 }, { x: 68, y: 28 }, { x: 66, y: 27 },
  { x: 64, y: 26 }, { x: 62, y: 25 }, { x: 60, y: 24 }, { x: 58, y: 23 },
  { x: 56, y: 24 }, { x: 54, y: 25 }, { x: 52, y: 26 }, { x: 50, y: 27 },
  { x: 48, y: 30 }, { x: 46, y: 32 }, { x: 44, y: 34 }, { x: 42, y: 36 },
  { x: 40, y: 38 }, { x: 38, y: 40 }, { x: 36, y: 42 }, { x: 34, y: 44 },
  { x: 32, y: 46 }, { x: 30, y: 48 }, { x: 28, y: 50 }, { x: 26, y: 48 },
  { x: 24, y: 46 }, { x: 22, y: 44 }, { x: 20, y: 42 }, { x: 18, y: 40 },
  { x: 20, y: 38 }, { x: 22, y: 36 }, { x: 24, y: 34 }, { x: 26, y: 36 },
  { x: 28, y: 38 }, { x: 30, y: 40 }, { x: 32, y: 42 }, { x: 34, y: 44 },
  { x: 36, y: 46 }, { x: 38, y: 48 }, { x: 40, y: 50 }, { x: 42, y: 52 },
  { x: 44, y: 54 }, { x: 46, y: 56 }, { x: 48, y: 58 }, { x: 50, y: 60 },
  { x: 52, y: 58 }, { x: 54, y: 56 }, { x: 56, y: 54 }, { x: 58, y: 52 },
  { x: 60, y: 50 }, { x: 62, y: 48 }, { x: 64, y: 46 }, { x: 66, y: 44 },
  { x: 68, y: 42 }, { x: 70, y: 40 }, { x: 72, y: 42 }, { x: 74, y: 44 },
  { x: 76, y: 46 }, { x: 78, y: 48 }, { x: 80, y: 50 }, { x: 82, y: 52 },
  { x: 84, y: 54 }, { x: 86, y: 56 }, { x: 88, y: 58 }, { x: 86, y: 60 },
  { x: 84, y: 62 }, { x: 82, y: 64 }, { x: 80, y: 66 }, { x: 78, y: 68 },
  { x: 76, y: 70 }, { x: 74, y: 72 }, { x: 72, y: 74 }, { x: 70, y: 76 },
  { x: 68, y: 78 }, { x: 66, y: 80 }, { x: 64, y: 82 }, { x: 62, y: 80 },
  { x: 60, y: 78 }, { x: 58, y: 76 }, { x: 56, y: 74 }, { x: 54, y: 72 },
  { x: 52, y: 70 }, { x: 50, y: 68 }, { x: 48, y: 66 }, { x: 46, y: 64 },
  { x: 44, y: 62 }, { x: 42, y: 60 }, { x: 40, y: 58 }, { x: 38, y: 56 },
  { x: 36, y: 58 }, { x: 34, y: 60 }, { x: 32, y: 62 }, { x: 30, y: 64 },
  { x: 28, y: 66 }, { x: 26, y: 68 }, { x: 24, y: 70 }, { x: 22, y: 72 },
  { x: 20, y: 74 }, { x: 18, y: 72 }, { x: 16, y: 70 }, { x: 14, y: 68 },
  { x: 12, y: 66 }, { x: 12, y: 68 }, { x: 12, y: 70 }, { x: 12, y: 72 },
  { x: 12, y: 74 }, { x: 12, y: 76 }, { x: 12, y: 78 }, { x: 14, y: 80 },
  { x: 16, y: 82 }, { x: 18, y: 84 }, { x: 20, y: 86 }, { x: 22, y: 88 },
  { x: 24, y: 90 }, { x: 26, y: 88 }, { x: 28, y: 86 }, { x: 30, y: 84 },
  { x: 32, y: 82 }, { x: 34, y: 80 }, { x: 36, y: 78 }, { x: 38, y: 76 },
  { x: 40, y: 74 }, { x: 42, y: 72 }, { x: 44, y: 70 }, { x: 46, y: 72 },
  { x: 48, y: 74 }, { x: 50, y: 76 }, { x: 52, y: 78 }, { x: 54, y: 80 },
  { x: 56, y: 82 }, { x: 54, y: 84 }, { x: 52, y: 86 }, { x: 50, y: 88 },
  { x: 48, y: 86 }, { x: 46, y: 84 }, { x: 44, y: 82 }, { x: 42, y: 80 },
  { x: 40, y: 82 }, { x: 38, y: 84 }, { x: 36, y: 86 }, { x: 34, y: 88 },
  { x: 32, y: 86 }, { x: 30, y: 84 }, { x: 28, y: 82 }, { x: 26, y: 80 },
  { x: 24, y: 78 }, { x: 22, y: 76 }, { x: 20, y: 74 }, { x: 18, y: 72 },
  { x: 16, y: 74 }, { x: 14, y: 76 }, { x: 12, y: 78 }, { x: 12, y: 80 },
  { x: 12, y: 82 }, { x: 12, y: 84 }, { x: 12, y: 86 }, { x: 12, y: 88 },
  { x: 14, y: 90 }, { x: 16, y: 88 }, { x: 18, y: 86 }, { x: 20, y: 84 },
  { x: 22, y: 82 }, { x: 24, y: 80 }, { x: 26, y: 82 }, { x: 28, y: 84 },
  { x: 30, y: 86 }, { x: 32, y: 84 }, { x: 34, y: 82 }, { x: 36, y: 80 },
  { x: 38, y: 82 }, { x: 40, y: 84 }, { x: 42, y: 86 }, { x: 44, y: 84 },
  { x: 46, y: 82 }, { x: 48, y: 80 }, { x: 50, y: 78 }, { x: 52, y: 76 },
  { x: 54, y: 74 }, { x: 56, y: 72 }, { x: 58, y: 70 }, { x: 60, y: 72 },
  { x: 62, y: 74 }, { x: 64, y: 76 }, { x: 66, y: 78 }, { x: 68, y: 80 },
  { x: 70, y: 82 }, { x: 72, y: 84 }, { x: 74, y: 86 }, { x: 76, y: 88 },
  { x: 78, y: 86 }, { x: 80, y: 84 }, { x: 82, y: 82 }, { x: 84, y: 80 },
  { x: 86, y: 78 }, { x: 88, y: 76 }, { x: 86, y: 74 }, { x: 84, y: 76 },
  { x: 82, y: 78 }, { x: 80, y: 76 }, { x: 78, y: 74 }, { x: 76, y: 72 },
  { x: 74, y: 70 }, { x: 72, y: 68 }, { x: 70, y: 66 }, { x: 68, y: 64 },
  { x: 66, y: 62 }, { x: 64, y: 60 }, { x: 62, y: 58 }, { x: 60, y: 56 },
  { x: 58, y: 54 }, { x: 56, y: 52 }, { x: 54, y: 50 }, { x: 52, y: 48 },
  { x: 50, y: 46 }, { x: 48, y: 44 }, { x: 46, y: 42 }, { x: 44, y: 40 },
  { x: 42, y: 38 }, { x: 40, y: 36 }, { x: 38, y: 34 }, { x: 36, y: 32 },
  { x: 34, y: 30 }, { x: 32, y: 32 }, { x: 30, y: 34 }, { x: 28, y: 36 },
  { x: 26, y: 38 }, { x: 24, y: 40 }, { x: 22, y: 42 }, { x: 20, y: 44 },
  { x: 18, y: 46 }, { x: 16, y: 48 }, { x: 14, y: 50 }, { x: 12, y: 52 },
  { x: 12, y: 54 }, { x: 12, y: 56 }, { x: 12, y: 58 }, { x: 12, y: 60 },
  { x: 12, y: 62 }, { x: 12, y: 64 }, { x: 14, y: 62 }, { x: 16, y: 60 },
  { x: 18, y: 58 }, { x: 20, y: 56 }, { x: 22, y: 54 }, { x: 24, y: 52 },
  { x: 26, y: 50 }, { x: 28, y: 48 }, { x: 30, y: 46 }, { x: 32, y: 44 },
  { x: 34, y: 42 }, { x: 36, y: 40 }, { x: 38, y: 38 }, { x: 40, y: 36 },
  { x: 42, y: 34 }, { x: 44, y: 36 }, { x: 46, y: 38 }, { x: 48, y: 40 },
  { x: 50, y: 42 }, { x: 52, y: 44 }, { x: 54, y: 46 }, { x: 56, y: 48 },
  { x: 58, y: 50 }, { x: 60, y: 52 }, { x: 62, y: 54 }, { x: 64, y: 56 },
  { x: 66, y: 58 }, { x: 68, y: 60 }, { x: 70, y: 62 }, { x: 72, y: 60 },
  { x: 74, y: 58 }, { x: 76, y: 56 }, { x: 78, y: 54 }, { x: 80, y: 52 },
  { x: 82, y: 50 }, { x: 84, y: 48 }, { x: 86, y: 46 }, { x: 88, y: 44 },
  { x: 86, y: 42 }, { x: 84, y: 40 }, { x: 82, y: 38 }, { x: 80, y: 36 },
  { x: 78, y: 34 }, { x: 76, y: 32 }, { x: 74, y: 30 }, { x: 72, y: 28 },
  { x: 70, y: 26 }, { x: 68, y: 24 }, { x: 66, y: 22 }, { x: 64, y: 20 },
  { x: 62, y: 18 }, { x: 60, y: 20 }, { x: 58, y: 22 }, { x: 56, y: 24 },
  { x: 54, y: 26 }, { x: 52, y: 28 }, { x: 50, y: 30 }, { x: 48, y: 32 },
  { x: 46, y: 34 }, { x: 44, y: 36 }, { x: 42, y: 38 }, { x: 40, y: 40 },
  { x: 38, y: 42 }, { x: 36, y: 44 }, { x: 34, y: 46 }, { x: 32, y: 48 },
  { x: 30, y: 50 }, { x: 28, y: 52 }, { x: 26, y: 54 }, { x: 24, y: 56 },
  { x: 22, y: 58 }, { x: 20, y: 60 }, { x: 18, y: 62 }, { x: 16, y: 64 },
  { x: 14, y: 66 }, { x: 12, y: 68 },
];

function getPathPoint(progress: number): PathPoint {
  const clamped = Math.max(0, Math.min(1, progress));
  const index = clamped * (PEN_PATH.length - 1);
  const i = Math.floor(index);
  const t = index - i;
  const p0 = PEN_PATH[Math.max(0, i)];
  const p1 = PEN_PATH[Math.min(PEN_PATH.length - 1, i + 1)];
  const x = p0.x + (p1.x - p0.x) * t;
  const y = p0.y + (p1.y - p0.y) * t;
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);
  return { x, y, angle };
}

function PenTip({ progress, visible }: { progress: number; visible: boolean }): React.ReactNode {
  const p = getPathPoint(progress);
  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      style={{ left: `${p.x - 3}%`, top: `${p.y - 1.5}%` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
        <svg width="22" height="28" viewBox="0 0 22 28" fill="none" style={{ transform: `rotate(${String(p.angle + 90)}deg)` }}>
        <path d="M11 2L20 27H2L11 2Z" fill="#4338ca" stroke="#1e1b4b" strokeWidth="0.5" />
        <path d="M11 4L18 25.5H4L11 4Z" fill="#818cf8" opacity="0.3" />
        <ellipse cx="11" cy="3" rx="1.2" ry="0.8" fill="#e0e7ff" />
      </svg>
    </motion.div>
  );
}

export function SplashScreen({ onFinish }: SplashScreenProps): React.ReactNode {
  const [phase, setPhase] = useState<"enter" | "pen" | "writing" | "pen-out" | "text" | "exit">("enter");
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const delay = (ms: number): Promise<void> =>
      new Promise((r) => {
        const id = setTimeout(() => {
          if (mountedRef.current) r(undefined);
        }, ms);
      });

    const startWriting = (duration: number): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        const tick = (now: number) => {
          if (!mountedRef.current) return;
          const elapsed = now - startTime;
          const t = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setProgress(eased);
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });
    };

    const run = async (): Promise<void> => {
      if (!mountedRef.current) return;
      setPhase("pen");
      await delay(300);

      if (!mountedRef.current) return;
      setPhase("writing");
      await startWriting(2700);

      if (!mountedRef.current) return;
      setPhase("pen-out");
      await delay(300);

      if (!mountedRef.current) return;
      setPhase("text");
      await delay(800);

      if (!mountedRef.current) return;
      setPhase("exit");
      await delay(500);

      if (mountedRef.current) {
        setShowSplash(false);
        if (onFinish) onFinish();
      }
    };

    run();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!showSplash) return null;

  const p = getPathPoint(progress);
  const maskReveal = Math.max(0, Math.min(100, 100 - p.x * 1.1 + 4));

  const isPenVisible = phase === "pen" || phase === "writing";
  const isTextVisible = phase === "text" || phase === "exit";
  const isExiting = phase === "exit";

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="relative w-[220px] sm:w-[280px] md:w-[340px] aspect-[1134/1058]">
        <Image
          src="/logo-splash.svg"
          alt="El-Bannawy"
          fill
          className="object-contain"
          priority
          unoptimized
        />

        <div
          className="absolute inset-0 bg-white"
          style={{
            WebkitMaskImage: `linear-gradient(to left, transparent ${String(maskReveal)}%, #000 ${String(maskReveal + 5)}%)`,
            maskImage: `linear-gradient(to left, transparent ${String(maskReveal)}%, #000 ${String(maskReveal + 5)}%)`,
          }}
        />

        <PenTip progress={progress} visible={isPenVisible} />

        {phase === "writing" && progress > 0.02 && (
          <svg className="absolute inset-0 pointer-events-none z-[5]" style={{ width: "100%", height: "100%" }} viewBox="0 0 100 100">
            <defs>
              <linearGradient id="inkFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#1a1a2e" stopOpacity="0" />
                <stop offset="0.6" stopColor="#1a1a2e" stopOpacity="0.08" />
                <stop offset="1" stopColor="#1a1a2e" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <polyline
              points={(() => {
                const trailLen = Math.floor(progress * PEN_PATH.length);
                const pts: { x: number; y: number }[] = [];
                for (let i = Math.max(0, trailLen - 15); i < trailLen; i++) {
                  const pp = getPathPoint(i / PEN_PATH.length);
                  pts.push(pp);
                }
                return pts.map((pt) => `${String(pt.x)} ${String(pt.y)}`).join(", ");
              })()}
              fill="none"
              stroke="url(#inkFade)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <AnimatePresence>
        {isTextVisible && (
          <motion.div
            key="subtitle"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-6 sm:mt-8 text-center"
          >
            <p
              className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide"
              style={{ color: "#1a1a2e", fontFamily: "var(--font-cairo), sans-serif" }}
            >
              MR. Ahmed El-Banna
            </p>
            <p
              className="text-[10px] sm:text-xs mt-2 tracking-[0.15em] uppercase font-medium"
              style={{ color: "#6366f1" }}
            >
              Educational Platform
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#14b8a6" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#14b8a6" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#14b8a6" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
