"use client";

import { Suspense, lazy, type ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";

const AuthProvider = lazy(() => import("@/providers/auth-provider").then(m => ({ default: m.AuthProvider })));

export function Providers({ children }: { children: ReactNode }): ReactNode {
  return (
    <QueryProvider>
      <ThemeProvider>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>}>
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
      </ThemeProvider>
    </QueryProvider>
  );
}
