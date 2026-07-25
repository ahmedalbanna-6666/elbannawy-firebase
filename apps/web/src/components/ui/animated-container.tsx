"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-in" | "fade-slide-down" | "fade-slide-up" | "scale-in";
}

const ANIMATIONS = {
  "fade-in": "opacity-0 [animation:vocab-fade-in_0.3s_ease_forwards]",
  "fade-slide-down": "opacity-0 [animation:vocab-fade-slide-down_0.3s_ease_forwards]",
  "fade-slide-up": "opacity-0 [animation:vocab-fade-slide-up_0.3s_ease_forwards]",
  "scale-in": "opacity-0 [animation:scale-in_0.25s_ease_forwards]",
};

export function AnimatedContainer({
  children,
  className,
  delay = 0,
  animation = "fade-slide-up",
}: AnimatedContainerProps): ReactNode {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(true); }, delay);
    return () => { clearTimeout(timer); };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        visible ? ANIMATIONS[animation] : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StaggerListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  baseDelay?: number;
  staggerDelay?: number;
}

export function StaggerList({
  children,
  className,
  itemClassName,
  baseDelay = 0,
  staggerDelay = 80,
}: StaggerListProps): ReactNode {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <AnimatedContainer
          key={i}
          delay={baseDelay + i * staggerDelay}
          className={itemClassName}
        >
          {child}
        </AnimatedContainer>
      ))}
    </div>
  );
}
