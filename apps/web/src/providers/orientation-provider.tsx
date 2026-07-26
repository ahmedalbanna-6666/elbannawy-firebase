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
  /** Release any forced orientation lock — app returns to natural rotation */
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
  try {
    const type = (screen as Screen & { orientation?: { type: string } }).orientation?.type;
    if (type) return type.startsWith("landscape") ? "landscape" : "portrait";
  } catch { /* cross-origin */ }
  try {
    if (window.matchMedia("(orientation: landscape)").matches) return "landscape";
    if (window.matchMedia("(orientation: portrait)").matches) return "portrait";
  } catch { /* unsupported */ }
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

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => { updateDocumentClass(orientation); }, [orientation]);

  // ─── Unlock JS-lock on mount — PWA must be free to rotate naturally ───
  useEffect(() => {
    try {
      const so = screen as Screen & { orientation?: { unlock?: () => void } };
      if (so.orientation?.unlock) so.orientation.unlock();
    } catch { /* ignore */ }
  }, []);

  // ─── Passive detection: orientationchange + resize + matchMedia ───
  useEffect(() => {
    const update = (): void => {
      if (!mountedRef.current) return;
      setOrientation(detectOrientation());
      setAngle(detectAngle());
    };

    const onOrientationChange = (): void => { requestAnimationFrame(update); };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = (): void => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(update, 100);
    };

    let landscapeMq: MediaQueryList | null = null;
    let portraitMq: MediaQueryList | null = null;
    try {
      landscapeMq = window.matchMedia("(orientation: landscape)");
      portraitMq = window.matchMedia("(orientation: portrait)");
      if (landscapeMq.addEventListener) landscapeMq.addEventListener("change", update);
      if (portraitMq.addEventListener) portraitMq.addEventListener("change", update);
    } catch { /* unsupported */ }

    try {
      const so = screen as Screen & { orientation?: { addEventListener?: (t: string, fn: () => void) => void } };
      if (so.orientation?.addEventListener) so.orientation.addEventListener("change", onOrientationChange);
    } catch { /* ignore */ }

    window.addEventListener("orientationchange", onOrientationChange);
    window.addEventListener("resize", onResize);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (landscapeMq?.removeEventListener) landscapeMq.removeEventListener("change", update);
      if (portraitMq?.removeEventListener) portraitMq.removeEventListener("change", update);
      try {
        const so = screen as Screen & { orientation?: { removeEventListener?: (t: string, fn: () => void) => void } };
        if (so.orientation?.removeEventListener) so.orientation.removeEventListener("change", onOrientationChange);
      } catch { /* ignore */ }
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ─── Active forced-rotation via deviceorientation (hardware sensor) ───
  // Detects the physical phone orientation even when the system rotation lock is ON.
  // Calls lock() automatically when the user physically rotates the device.
  useEffect(() => {
    let gammaThreshold = 50; // degrees from upright before we force-rotate
    let lastOrientation: Orientation | null = null;
    let consentRequested = false;

    const handleMotion = (event: DeviceOrientationEvent): void => {
      if (!mountedRef.current) return;
      const gamma = event.gamma; // left(-) / right(+) tilt
      if (gamma === null) return;

      // Determine physical orientation from gamma
      const physicalOrientation: Orientation = Math.abs(gamma) > gammaThreshold ? "landscape" : "portrait";

      // Only act when it crosses the threshold (debounce by ignoring small changes)
      if (physicalOrientation === lastOrientation) return;
      lastOrientation = physicalOrientation;

      // If we already have a JS lock in the target orientation, skip
      if (lockedOrientation.current === physicalOrientation) return;

      // Try to force-lock the app to the physical orientation
      const so = screen as Screen & { orientation?: { lock?: (o: string) => Promise<void> } };
      if (so.orientation?.lock) {
        so.orientation.lock(
          physicalOrientation === "landscape" ? "landscape-primary" : "portrait-primary"
        ).then(() => {
          lockedOrientation.current = physicalOrientation;
          setOrientation(physicalOrientation);
          setAngle(detectAngle());
        }).catch(() => {
          // lock failed (no permission, no gesture, or unsupported)
        });
      }
    };

    // iOS 13+ requires explicit permission request for DeviceOrientationEvent
    const devOrientation = window as Window & {
      DeviceOrientationEvent?: {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
    };

    const startListening = (): void => {
      window.addEventListener("deviceorientation", handleMotion);
    };

    if (devOrientation.DeviceOrientationEvent?.requestPermission && !consentRequested) {
      consentRequested = true;
      // We need a user gesture to request permission. Wait for first click/touch.
      const gestureHandler = (): void => {
        document.removeEventListener("click", gestureHandler);
        document.removeEventListener("touchstart", gestureHandler);
        devOrientation.DeviceOrientationEvent!.requestPermission!().then((state) => {
          if (state === "granted") startListening();
        }).catch(() => {});
      };
      document.addEventListener("click", gestureHandler);
      document.addEventListener("touchstart", gestureHandler);
      // Clean up the gesture handlers if component unmounts before gesture
      return () => {
        document.removeEventListener("click", gestureHandler);
        document.removeEventListener("touchstart", gestureHandler);
      };
    }

    // Non-iOS: start immediately
    if (!consentRequested) {
      startListening();
    }

    return () => {
      window.removeEventListener("deviceorientation", handleMotion);
    };
  }, []);

  // ─── lock / unlock exposed helpers ───
  const lock = useCallback(async (o: Orientation): Promise<void> => {
    try {
      const so = screen as Screen & { orientation?: { lock?: (o: string) => Promise<void> } };
      if (so.orientation?.lock) {
        await so.orientation.lock(o === "landscape" ? "landscape-primary" : "portrait-primary");
        lockedOrientation.current = o;
        setOrientation(o);
        setAngle(detectAngle());
      }
    } catch {
      /* lock not supported or denied */
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
      /* unlock not supported */
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
