"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { OrientationProvider } from "@/providers/orientation-provider";
import { ErrorBoundary } from "@/components/observability/error-boundary";
import { printSessionSummary } from "@/lib/observability/logger";

export function Providers({ children }: { children: ReactNode }): ReactNode {
  useEffect(() => {
    const handler = () => printSessionSummary();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <OrientationProvider>
            <AuthProvider>{children}</AuthProvider>
          </OrientationProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
