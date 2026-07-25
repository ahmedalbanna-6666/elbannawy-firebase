import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = String(nextId++);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export function useToast(): {
  toast: (message: string, type?: Toast["type"], duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
} {
  const addToast = useToastStore((s) => s.addToast);
  return {
    toast: (message, type = "info", duration) => addToast({ message, type, duration }),
    success: (message) => addToast({ message, type: "success" }),
    error: (message) => addToast({ message, type: "error" }),
    info: (message) => addToast({ message, type: "info" }),
    warning: (message) => addToast({ message, type: "warning" }),
  };
}
