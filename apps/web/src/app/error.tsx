"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps): React.ReactNode {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-16 w-16 text-danger-500" />
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
        حدث خطأ غير متوقع
      </h1>
      <p className="max-w-md text-sm text-neutral-500">
        عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
      </p>
      <Button
        variant="primary"
        onClick={reset}
      >
        إعادة المحاولة
      </Button>
    </div>
  );
}
