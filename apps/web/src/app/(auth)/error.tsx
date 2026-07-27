"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function AuthError({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <p className="text-sm text-neutral-500">حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.</p>
      <Button variant="primary" size="sm" onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
