"use client";

import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback, type ReactNode } from "react";

type Orientation = "portrait" | "landscape";

interface OrientationContextValue {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  angle: number;
  /** Force-lock the app to a specific orientation (bypasses system rotation lock when supported) */
  lock: (o: Orientation) => Promise<void>;
  /** Release any forced orientation lock */
  unlock: () => Promise<void>;
}

const OrientationContext = createContext<OrientationContextValue | null>(null);

const ORIENTATION_CLASSES = ["orientation-portrait", "orientation-landscape"] as const;

function updateDocumentClass(o: Orientation): void {
  const root = document.documentElement;
  root.classList.remove(...ORIENTATION_CLASSES);
  root.classList.add(`orientation-${o}`);
  root.style.setProperty("--orientation", o);
}

function detectOrientation(): Orientation {
  if (typeof window === "undefined") return "portrait";
  // 1. Screen Orientation API
  try {
    const t = (screen as Screen & { orientation?: { type: string } }).orientation?.type;
    if (t) return t.startsWith("landscape") ? "landscape" : "portrait";
  } catch { /* ignore */ }
  // 2. matchMedia (iOS Safari best)
  try {
    if (window.matchMedia("(orientation: landscape)").matches) return "landscape";
    if (window.matchMedia("(orientation: portrait)").matches) return "portrait";
  } catch { /* ignore */ }
  // 3. Dimension fallback
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

function detectAngle(): number {
  if (typeof window === "undefined") return 0;
  try {
    const a = (screen as Screen & { orientation?: { angle: number } }).orientation?.angle;
    if (a !== undefined) return a;
  } catch { /* ignore */ }
  return (window as Window & { orientation?: number }).orientation ?? 0;
}

export function OrientationProvider({ children }: { children: ReactNode }): ReactNode {
  const [orientation, setOrientation] = useState<Orientation>(detectOrientation);
  const [angle, setAngle] = useState(detectAngle);
  const mountedRef = useRef(false);
  const lockedOrientation = useRef<Orientation | null>(null);
  const prevOrientation = useRef<Orientation>(orientation);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Sync CSS classes
  useEffect(() => { updateDocumentClass(orientation); }, [orientation]);

  // Unlock any JS lock on mount
  useEffect(() => {
    try {
      const so = screen as Screen & { orientation?: { unlock?: () => void } };
      if (so.orientation?.unlock) so.orientation.unlock();
    } catch { /* ignore */ }
  }, []);

  // ─── Passive detection ───
  useEffect(() => {
    const apply = (): void => {
      if (!mountedRef.current) return;
      const next = detectOrientation();
      prevOrientation.current = next;
      setOrientation(next);
      setAngle(detectAngle());
    };

    // orientationchange: iOS fires this, then viewport updates
    // rAF ensures we read the new dimensions
    const onOrientationChange = (): void => { requestAnimationFrame(apply); };

    // resize: fires after orientationchange, safe to read directly
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = (): void => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(apply, 80);
    };

    // matchMedia: fires instantly when orientation changes
    let landscapeMq: MediaQueryList | null = null;
    let portraitMq: MediaQueryList | null = null;
    try {
      landscapeMq = window.matchMedia("(orientation: landscape)");
      portraitMq = window.matchMedia("(orientation: portrait)");
      const onMatch = (): void => { requestAnimationFrame(apply); };
      if (landscapeMq.addEventListener) landscapeMq.addEventListener("change", onMatch);
      if (portraitMq.addEventListener) portraitMq.addEventListener("change", onMatch);
    } catch { /* ignore */ }

    // Screen Orientation API
    try {
      const so = screen as Screen & { orientation?: { addEventListener?: (t: string, fn: () => void) => void } };
      if (so.orientation?.addEventListener) so.orientation.addEventListener("change", onOrientationChange);
    } catch { /* ignore */ }

    window.addEventListener("orientationchange", onOrientationChange);
    window.addEventListener("resize", onResize);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      try {
        const so = screen as Screen & { orientation?: { removeEventListener?: (t: string, fn: () => void) => void } };
        if (so.orientation?.removeEventListener) so.orientation.removeEventListener("change", onOrientationChange);
      } catch { /* ignore */ }
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ─── lock / unlock ───
  const lock = useCallback(async (o: Orientation): Promise<void> => {
    try {
      const so = screen as Screen & { orientation?: { lock?: (l: string) => Promise<void> } };
      if (so.orientation?.lock) {
        await so.orientation.lock(o === "landscape" ? "landscape-primary" : "portrait-primary");
        lockedOrientation.current = o;
        setOrientation(o);
        setAngle(detectAngle());
      }
    } catch {
      /* lock denied */
    }
  }, []);

  const unlock = useCallback(async (): Promise<void> => {
    try {
      const so = screen as Screen & { orientation?: { unlock?: () => void } };
      if (so.orientation?.unlock) so.orientation.unlock();
      lockedOrientation.current = null;
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        setOrientation(detectOrientation());
        setAngle(detectAngle());
      });
    } catch {
      /* unlock denied */
    }
  }, []);

  const value = useMemo(
    () => ({ orientation, isPortrait: orientation === "portrait", isLandscape: orientation === "landscape", angle, lock, unlock }),
    [orientation, angle, lock, unlock],
  );

  return <OrientationContext.Provider value={value}>{children}</OrientationContext.Provider>;
}

export function useOrientation(): OrientationContextValue {
  const ctx = useContext(OrientationContext);
  if (!ctx) throw new Error("useOrientation must be used within an OrientationProvider");
  return ctx;
}
