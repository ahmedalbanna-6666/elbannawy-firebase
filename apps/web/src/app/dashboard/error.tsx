"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps): React.ReactNode {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-danger-500" />
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        حدث خطأ أثناء تحميل لوحة التحكم
      </h2>
      <p className="max-w-md text-sm text-neutral-500">
        تعذر تحميل البيانات. قد يكون هناك مشكلة في الاتصال أو الخادم.
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
