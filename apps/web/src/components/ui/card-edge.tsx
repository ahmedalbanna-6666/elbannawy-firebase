import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { bg: string; glow: string }> = {
  primary: { bg: "bg-primary-500", glow: "shadow-[0_0_10px_rgba(6,182,212,0.3)]" },
  orange: { bg: "bg-warning-500", glow: "shadow-[0_0_10px_rgba(249,115,22,0.3)]" },
  info: { bg: "bg-info-500", glow: "shadow-[0_0_10px_rgba(6,182,212,0.3)]" },
} as const;

interface CardEdgeProps {
  variant: "primary" | "orange" | "info" | "hidden";
  className?: string;
}

export type { CardEdgeProps };

export function CardEdge({ variant, className }: CardEdgeProps): ReactNode {
  if (variant === "hidden") return null;

  const style = STYLES[variant];
  if (!style) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute end-0 top-3 h-[calc(100%-24px)] w-[3px] rounded-full",
        style.bg,
        style.glow,
        className,
      )}
    />
  );
}
