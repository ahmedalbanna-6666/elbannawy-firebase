"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { memo, type ReactNode } from "react";

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  activeIcon?: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  centerId?: string;
  className?: string;
}

export const BottomNav = memo(function BottomNav({ items, centerId, className }: BottomNavProps): ReactNode {
  const navItems = Array.isArray(items) ? items : [];
  return (
    <nav
      className={cn(
        "flex h-[calc(72px+env(safe-area-inset-bottom,0px))] items-center justify-around border-t border-neutral-200 bg-neutral-50/90 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] dark:border-neutral-700 dark:bg-neutral-900/90",
        className,
      )}
    >
      {navItems.map((item) => {
        const isCenter = item.id === centerId;
        const Icon = item.active && item.activeIcon ? item.activeIcon : item.icon;
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            aria-label={item.label}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 touch-target",
              isCenter ? "-mt-3" : "",
              item.active
                ? "text-violet-600 dark:text-violet-400"
                : "text-neutral-400 dark:text-neutral-500",
            )}
          >
            {isCenter ? (
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
                  item.active
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400",
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
            ) : (
              <Icon className={cn("h-6 w-6", item.active ? "drop-shadow-[0_0_6px_rgba(139,92,246,0.4)]" : "")} />
            )}
            <span className={isCenter ? "mt-0.5" : ""}>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -end-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
});

export type { BottomNavProps, BottomNavItem };
