"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

interface EducationalSystem {
  id: string;
  name: string;
  nameAr: string;
}

interface Stage {
  id: string;
  name: string;
  nameAr: string;
  educationalSystemId: string;
  order: number;
  isActive: boolean;
  grades: { id: string; name: string; nameAr: string; displayOrder: number }[];
}

export default function AdminStagesPage(): ReactNode {
  const { data: systems } = useQuery<EducationalSystem[]>({
    queryKey: ["admin-educational-systems"],
    queryFn: async () => {
      const res = await api.get<EducationalSystem[]>("/admin/educational-systems");
      return res.data ?? [];
    },
  });
  const { data: stages, isLoading, isError, error } = useQuery<Stage[]>({
    queryKey: ["admin-stages"],
    queryFn: async () => {
      const res = await api.get<Stage[]>("/admin/stages");
      return res.data ?? [];
    },
  });

  const systemMap = useMemo(() => {
    const m = new Map<string, string>();
    if (systems) for (const s of systems) m.set(s.id, s.nameAr);
    return m;
  }, [systems]);

  if (isLoading) return <StagesSkeleton />;
  if (isError) return <ErrorState title="فشل التحميل" description={error instanceof Error ? error.message : "حدث خطأ"} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">المراحل الدراسية</h1>
        <p className="mt-1 text-sm text-neutral-500">المراحل الدراسية المتاحة في المنصة (بيانات ثابتة)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            {(stages ?? []).map((stage) => (
              <div key={stage.id} className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-primary-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{stage.nameAr}</span>
                        <span className="text-xs text-neutral-400">({stage.name})</span>
                        <Badge variant={stage.isActive ? "success" : "secondary"}>{stage.isActive ? "نشط" : "غير نشط"}</Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {systemMap.get(stage.educationalSystemId) || stage.educationalSystemId} — ترتيب: {stage.order}
                        <span className="mr-2 font-mono text-neutral-400" dir="ltr">({stage.id})</span>
                      </p>
                    </div>
                  </div>
                </div>
                {stage.grades.length > 0 && (
                  <div className="mt-3 mr-8 flex flex-wrap gap-2">
                    {stage.grades.map((grade) => (
                      <span key={grade.id} className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-xs text-primary-700 dark:text-primary-300">
                        {grade.nameAr}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StagesSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
}
