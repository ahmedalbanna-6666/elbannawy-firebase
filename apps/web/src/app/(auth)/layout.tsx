"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
        <Skeleton className="h-8 w-48" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}
