"use client";

import { type ReactNode } from "react";
import { useToastStore, type Toast } from "./toast-store";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<Toast["type"], LucideIcon> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLE_MAP: Record<Toast["type"], string> = {
  success: "border-success-500/30 bg-success-500/10 text-success-700 dark:text-success-300",
  error: "border-danger-500/30 bg-danger-500/10 text-danger-700 dark:text-danger-300",
  warning: "border-warning-500/30 bg-warning-500/10 text-warning-700 dark:text-warning-300",
  info: "border-primary-500/30 bg-primary-500/10 text-primary-700 dark:text-primary-300",
};

export function ToastContainer(): ReactNode {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
      {toasts.map((toast) => {
        const Icon = ICON_MAP[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md [animation:vocab-fade-slide-up_0.25s_ease]",
              STYLE_MAP[toast.type],
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 leading-relaxed">{toast.message}</p>
            <button
              onClick={() => { removeToast(toast.id); }}
              className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
