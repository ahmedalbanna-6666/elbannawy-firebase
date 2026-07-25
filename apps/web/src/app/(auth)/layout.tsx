"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, authReady } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated || !authReady) return;
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [hasHydrated, authReady, isAuthenticated, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}
