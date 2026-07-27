import { cn } from "@/lib/utils";
import { Inbox, BookOpen, GraduationCap, ClipboardList, Sparkles, Search, FileQuestion, AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "./button";
import type { ReactNode } from "react";

const ILLUSTRATIONS: Record<string, { icon: LucideIcon; gradient: string }> = {
  default: { icon: Inbox, gradient: "from-neutral-400 to-neutral-600" },
  course: { icon: BookOpen, gradient: "from-primary-400 to-secondary-500" },
  quiz: { icon: GraduationCap, gradient: "from-warning-400 to-orange-500" },
  homework: { icon: ClipboardList, gradient: "from-info-400 to-primary-500" },
  ai: { icon: Sparkles, gradient: "from-purple-400 to-pink-500" },
  search: { icon: Search, gradient: "from-primary-400 to-cyan-500" },
  error: { icon: AlertTriangle, gradient: "from-danger-400 to-warning-500" },
  question: { icon: FileQuestion, gradient: "from-warning-400 to-amber-500" },
};

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: keyof typeof ILLUSTRATIONS;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = "default",
}: EmptyStateProps): ReactNode {
  const Illus = ILLUSTRATIONS[variant] ?? ILLUSTRATIONS.default;
  if (!Illus) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16 text-center",
        className,
      )}
    >
      <div className="relative">
        <div className={cn(
          "flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg [animation:vocab-fade-slide-down_0.4s_ease]",
          Illus.gradient,
        )}>
          {icon ?? (
            <Illus.icon className="h-10 w-10 text-white" />
          )}
        </div>
        <div className={cn(
          "absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-neutral-500 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-400",
        )}>
          <Inbox className="h-3 w-3" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        {description && (
          <p className="max-w-sm text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export type { EmptyStateProps };
