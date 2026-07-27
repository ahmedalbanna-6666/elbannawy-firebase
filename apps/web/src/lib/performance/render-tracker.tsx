"use client";

/**
 * React Render Tracker — Development tool
 *
 * Usage:
 *   <RenderTracker name="MyComponent" />
 *
 * To enable: localStorage.setItem("debug-renders", "true")
 * To filter: localStorage.setItem("debug-renders-filter", "Header,BottomNav")
 *
 * Output: Chrome DevTools Console → filtered render count + timing
 */

import React from "react";
import { useEffect, useRef, type ReactNode } from "react";

const isDev = typeof window !== "undefined" &&
  window.localStorage?.getItem("debug-renders") === "true";

interface RenderTrackerProps {
  name: string;
}

export function RenderTracker({ name }: RenderTrackerProps): null {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    if (!isDev) return;
    renderCount.current++;
    const elapsed = performance.now() - startTime.current;
    const filter = window.localStorage.getItem("debug-renders-filter");
    if (filter && !name.includes(filter)) return;
    console.log(
      `%c[Render] %c${name}%c #${renderCount.current} %c+${elapsed.toFixed(1)}ms`,
      "color:#888",
      "color:#06b6d4;font-weight:bold",
      "color:#888",
      "color:#22c55e",
    );
  });

  return null;
}

/**
 * React Profiler Wrapper
 *
 * Usage:
 *   <Profiler name="Sidebar">
 *     <Sidebar />
 *   </Profiler>
 */

interface ProfilerProps {
  name: string;
  children: ReactNode;
}

export function Profiler({ name, children }: ProfilerProps): ReactNode {
  if (!isDev) return children;
  const commits = useRef(0);
  const totalTime = useRef(0);

  const handleRender = (
    _id: string,
    _phase: string,
    actualDuration: number,
  ): void => {
    commits.current++;
    totalTime.current += actualDuration;
    const avg = (totalTime.current / commits.current).toFixed(2);
    console.log(
      `%c[Profiler] %c${name}%c commit #${commits.current} | ${actualDuration.toFixed(2)}ms | avg ${avg}ms`,
      "color:#a855f7",
      "color:#f59e0b;font-weight:bold",
      "color:#888",
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- React.Profiler is stable
  const Prof = (React as any).Profiler;
  if (!Prof) return children;

  return (
    <Prof id={name} onRender={handleRender}>
      {children}
    </Prof>
  );
}
