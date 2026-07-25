import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): ReactNode {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function PageSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }): ReactNode {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-10 w-full rounded-xl" />
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }): ReactNode {
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border border-neutral-100 p-4 dark:border-neutral-800", className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export function StatsGridSkeleton(): ReactNode {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-neutral-100 p-4 dark:border-neutral-800">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
