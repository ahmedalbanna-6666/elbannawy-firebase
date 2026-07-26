"use client";

import { type ReactNode } from "react";

export function RootClient({ children }: { children: React.ReactNode }): ReactNode {
  return <>{children}</>;
}
