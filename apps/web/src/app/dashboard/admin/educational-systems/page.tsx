"use client";

import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

interface EducationalSystem {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  isActive: boolean;
}

export default function AdminEducationalSystemsPage(): ReactNode {
  const { data: systems, isLoading, isError, error } = useQuery<EducationalSystem[]>({
    queryKey: ["admin-educational-systems"],
    queryFn: async () => {
      const res = await api.get<EducationalSystem[]>("/admin/educational-systems");
      return res.data ?? [];
    },
  });

  if (isLoading) return <EducationalSystemsSkeleton />;
  if (isError) return <ErrorState title="فشل التحميل" description={error instanceof Error ? error.message : "حدث خطأ"} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">الأنظمة التعليمية</h1>
        <p className="mt-1 text-sm text-neutral-500">الأنظمة التعليمية المتاحة في المنصة (بيانات ثابتة)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            {(systems ?? []).map((sys) => (
              <div key={sys.id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{sys.nameAr}</span>
                      <span className="text-xs text-neutral-400">({sys.name})</span>
                      <Badge variant={sys.isActive ? "success" : "secondary"}>{sys.isActive ? "نشط" : "غير نشط"}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{sys.description}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono" dir="ltr">{sys.id}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EducationalSystemsSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
}
