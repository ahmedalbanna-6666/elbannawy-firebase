"use client";

import { createContext, useContext, useEffect, useState, useRef, useMemo, type ReactNode } from "react";

type Orientation = "portrait" | "landscape";

interface OrientationContextValue {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  angle: number;
}

const OrientationContext = createContext<OrientationContextValue | null>(null);

function getOrientation(): Orientation {
  if (typeof window === "undefined") return "portrait";
  try {
    const type = (screen as Screen & { orientation?: { type: string } }).orientation?.type;
    if (type) return type.startsWith("landscape") ? "landscape" : "portrait";
  } catch {
    /* some browsers throw accessing screen.orientation in cross-origin iframes */
  }
  return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
}

function getAngle(): number {
  if (typeof window === "undefined") return 0;
  try {
    const angle = (screen as Screen & { orientation?: { angle: number } }).orientation?.angle;
    if (angle !== undefined) return angle;
  } catch {
    /* ignore */
  }
  return (window as Window & { orientation?: number }).orientation ?? 0;
}

function applyOrientationClass(orientation: Orientation): void {
  const root = document.documentElement;
  root.classList.remove("orientation-portrait", "orientation-landscape");
  root.classList.add(`orientation-${orientation}`);
  root.style.setProperty("--orientation", orientation);
}

export function OrientationProvider({ children }: { children: ReactNode }): ReactNode {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation);
  const [angle, setAngle] = useState(getAngle);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    applyOrientationClass(orientation);
  }, [orientation]);

  useEffect(() => {
    const update = (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const next = getOrientation();
        setOrientation(next);
        setAngle(getAngle());
        applyOrientationClass(next);
      }, 80);
    };

    const handleOrientationChange = (): void => {
      requestAnimationFrame(update);
    };

    const handleResize = (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(update, 120);
    };

    try {
      const so = (screen as Screen & { orientation?: { addEventListener?: (type: string, fn: () => void) => void; removeEventListener?: (type: string, fn: () => void) => void } }).orientation;
      if (so?.addEventListener) {
        so.addEventListener("change", handleOrientationChange);
      }
    } catch {
      /* screen.orientation not available */
    }

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleResize);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      try {
        const so = (screen as Screen & { orientation?: { addEventListener?: (type: string, fn: () => void) => void; removeEventListener?: (type: string, fn: () => void) => void } }).orientation;
        if (so?.removeEventListener) {
          so.removeEventListener("change", handleOrientationChange);
        }
      } catch {
        /* ignore */
      }
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleResize);
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
