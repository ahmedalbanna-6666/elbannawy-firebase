"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  nameAr: string;
}

interface Grade {
  id: string;
  name: string;
  nameAr: string;
  stageId: string;
  order: number;
  isActive: boolean;
}

export default function AdminGradesPage(): ReactNode {
  const { data: stages } = useQuery<Stage[]>({
    queryKey: ["admin-stages"],
    queryFn: async () => {
      const res = await api.get<Stage[]>("/admin/stages");
      return res.data ?? [];
    },
  });
  const { data: grades, isLoading, isError, error } = useQuery<Grade[]>({
    queryKey: ["admin-grades"],
    queryFn: async () => {
      const res = await api.get<Grade[]>("/admin/grades");
      return res.data ?? [];
    },
  });

  const stageMap = useMemo(() => {
    const m = new Map<string, string>();
    if (stages) for (const s of stages) m.set(s.id, s.nameAr);
    return m;
  }, [stages]);

  const groupedGrades = useMemo(() => {
    if (!grades) return [];
    const map = new Map<string, Grade[]>();
    for (const grade of grades) {
      const existing = map.get(grade.stageId) ?? [];
      existing.push(grade);
      map.set(grade.stageId, existing);
    }
    return Array.from(map.entries()).map(([stageId, items]) => ({
      stageId,
      stageName: stageMap.get(stageId) || stageId,
      grades: items.sort((a, b) => a.order - b.order),
    }));
  }, [grades, stageMap]);

  if (isLoading) return <GradesSkeleton />;
  if (isError) return <ErrorState title="فشل التحميل" description={error instanceof Error ? error.message : "حدث خطأ"} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">الصفوف الدراسية</h1>
        <p className="mt-1 text-sm text-neutral-500">الصفوف الدراسية المتاحة في المنصة (بيانات ثابتة)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            {groupedGrades.length === 0 ? (
              <p className="text-sm text-neutral-500">لا توجد صفوف دراسية</p>
            ) : (
              groupedGrades.map((group) => (
                <div key={group.stageId} className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">{group.stageName}</h3>
                  <div className="flex flex-col gap-2">
                    {group.grades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between rounded-md bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-primary-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{grade.nameAr}</span>
                            <span className="text-xs text-neutral-400">({grade.name})</span>
                            <Badge variant={grade.isActive ? "success" : "secondary"} className="text-[10px]">
                              {grade.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-400 font-mono" dir="ltr">{grade.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GradesSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
}
