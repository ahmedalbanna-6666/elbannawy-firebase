"use client";

import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback, type ReactNode } from "react";

type Orientation = "portrait" | "landscape";

interface OrientationContextValue {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  angle: number;
}

const OrientationContext = createContext<OrientationContextValue | null>(null);

const ORIENTATION_CLASSES = ["orientation-portrait", "orientation-landscape"] as const;

function detectOrientation(): Orientation {
  if (typeof window === "undefined") return "portrait";
  // 1. Screen Orientation API (Android Chrome, Samsung Internet)
  try {
    const so = (screen as Screen & { orientation?: { type: string } }).orientation?.type;
    if (so) return so.startsWith("landscape") ? "landscape" : "portrait";
  } catch {
    /* cross-origin iframe restriction */
  }
  // 2. matchMedia query (reliable on iOS Safari)
  try {
    const mq = window.matchMedia("(orientation: landscape)");
    if (mq.matches !== undefined) return mq.matches ? "landscape" : "portrait";
  } catch {
    /* unsupported */
  }
  // 3. Dimension ratio fallback
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

function detectAngle(): number {
  if (typeof window === "undefined") return 0;
  try {
    const a = (screen as Screen & { orientation?: { angle: number } }).orientation?.angle;
    if (a !== undefined) return a;
  } catch {
    /* ignore */
  }
  return (window as Window & { orientation?: number }).orientation ?? 0;
}

function applyOrientationClass(orientation: Orientation): void {
  const root = document.documentElement;
  root.classList.remove(...ORIENTATION_CLASSES);
  root.classList.add(`orientation-${orientation}`);
  root.style.setProperty("--orientation", orientation);
}

export function OrientationProvider({ children }: { children: ReactNode }): ReactNode {
  const [orientation, setOrientation] = useState<Orientation>(detectOrientation);
  const [angle, setAngle] = useState(detectAngle);
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Sync CSS classes whenever the state changes
  useEffect(() => {
    applyOrientationClass(orientation);
  }, [orientation]);

  useEffect(() => {
    // ─── Immediate update for orientation changes ───
    // iOS Safari fires orientationchange BEFORE viewport resizes,
    // so dimensions are stale. We use rAF to wait for the next paint
    // where dimensions are correct.
    const onOrientationChange = (): void => {
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        setOrientation(detectOrientation());
        setAngle(detectAngle());
      });
    };

    // ─── Debounced update for resize events ───
    const onResize = (): void => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setOrientation(detectOrientation());
        setAngle(detectAngle());
      }, 100);
    };

    // ─── Screen Orientation API (modern browsers) ───
    try {
      const so = (screen as Screen & { orientation?: { addEventListener?: (t: string, fn: () => void) => void; removeEventListener?: (t: string, fn: () => void) => void } }).orientation;
      if (so?.addEventListener) {
        so.addEventListener("change", onOrientationChange);
      }
    } catch {
      /* not available */
    }

    // ─── Fallback events ───
    window.addEventListener("orientationchange", onOrientationChange);
    window.addEventListener("resize", onResize);

    return () => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      try {
        const so = (screen as Screen & { orientation?: { addEventListener?: (t: string, fn: () => void) => void; removeEventListener?: (t: string, fn: () => void) => void } }).orientation;
        if (so?.removeEventListener) {
          so.removeEventListener("change", onOrientationChange);
        }
      } catch {
        /* ignore */
      }
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const value = useMemo(
    () => ({ orientation, isPortrait: orientation === "portrait", isLandscape: orientation === "landscape", angle }),
    [orientation, angle],
  );

  return <OrientationContext.Provider value={value}>{children}</OrientationContext.Provider>;
}

export function useOrientation(): OrientationContextValue {
  const ctx = useContext(OrientationContext);
  if (!ctx) throw new Error("useOrientation must be used within an OrientationProvider");
  return ctx;
}
