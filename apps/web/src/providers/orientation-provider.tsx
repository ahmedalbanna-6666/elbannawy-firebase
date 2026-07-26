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
  if (screen.orientation?.type) {
    return screen.orientation.type.startsWith("landscape") ? "landscape" : "portrait";
  }
  return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
}

function getAngle(): number {
  if (typeof window === "undefined") return 0;
  return screen.orientation?.angle ?? (window.orientation as number) ?? 0;
}

export function OrientationProvider({ children }: { children: ReactNode }): ReactNode {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation);
  const [angle, setAngle] = useState(getAngle);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setOrientation(getOrientation());
        setAngle(getAngle());
      }, 80);
    };

    const handleOrientationChange = (): void => {
      requestAnimationFrame(() => {
        setOrientation(getOrientation());
        setAngle(getAngle());
      });
    };

    const handleResize = (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(update, 120);
    };

    if (screen.orientation?.addEventListener) {
      screen.orientation.addEventListener("change", handleOrientationChange);
    }
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleResize);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (screen.orientation?.removeEventListener) {
        screen.orientation.removeEventListener("change", handleOrientationChange);
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
