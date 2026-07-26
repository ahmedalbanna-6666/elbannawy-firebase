"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { OrientationProvider } from "@/providers/orientation-provider";

export function Providers({ children }: { children: ReactNode }): ReactNode {
  return (
    <QueryProvider>
      <ThemeProvider>
        <OrientationProvider>
          <AuthProvider>{children}</AuthProvider>
        </OrientationProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
