"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { UnitLockOverlay } from "@/components/coins/unit-lock-overlay";
import { BookOpen, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonSummary {
  id: string;
  title: string;
  displayOrder: number;
  estimatedDuration: number;
  isPremium: boolean;
  sequentialMode: boolean;
  homeworkEnabled: boolean;
  quizEnabled: boolean;
}

interface Unit {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  isPremium: boolean;
  unlocked: boolean;
  lessons: LessonSummary[];
}

interface Stage {
  id: string;
  name: string;
  displayOrder: number;
  grades: {
    id: string;
    name: string;
    displayOrder: number;
    units: Unit[];
  }[];
}

interface UnitProgress {
  unitId: string;
  percentage: number;
}

export function StudentUnitsView(): ReactNode {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);

  const fetchCurriculum = useCallback(async (): Promise<void> => {
    try {
      const [curriculumRes, progressRes] = await Promise.all([
        api.get<Stage[]>("/curriculum"),
        api.get<{ units: UnitProgress[] }>("/curriculum/progress"),
      ]);
      if (curriculumRes.data) setStages(curriculumRes.data);
      if (progressRes.data?.units) {
        const map = new Map<string, number>();
        for (const u of progressRes.data.units) {
          map.set(u.unitId, u.percentage);
        }
        setProgressMap(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل المنهج");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCurriculum();
  }, [fetchCurriculum]);

  const allUnits = stages.flatMap((stage) =>
    stage.grades.flatMap((grade) => grade.units),
  );

  const reversed = [...allUnits].reverse();
  const currentUnitId = reversed.find((u) => (progressMap.get(u.id) ?? 0) > 0)?.id;

  if (loading) return <UnitsSkeleton />;
  if (error) return <ErrorState title="فشل تحميل المنهج" description={error} />;

  if (reversed.length === 0) {
    return (
      <EmptyState
        title="لا يوجد منهج متاح"
        description="يتم إنشاء محتوى المنهج حالياً"
        icon={<BookOpen className="h-16 w-16" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          الوحدات الدراسية
        </h1>
        <p className="mt-1 text-sm text-neutral-500">اختر الوحدة التي تريد دراستها</p>
      </div>

      <div className="relative mx-auto w-full max-w-2xl pb-4">
        <div className="absolute right-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary-500/10 via-primary-500/30 to-primary-500/10" />

        <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
          {reversed.map((unit, idx) => {
            const pct = progressMap.get(unit.id) ?? 0;
            const status = unit.id === currentUnitId ? "current" : pct >= 100 ? "completed" : "upcoming";
            const isLeft = idx % 2 === 0;
            const locked = unit.isPremium && !unit.unlocked;

            const handleOpen = (): void => {
              if (locked) {
                setOpenUnitId(unit.id);
                return;
              }
              if (unit.lessons.length > 0) {
                router.push(`/dashboard/lessons/${unit.id}`);
              }
            };

            return (
              <div key={unit.id} className="relative flex items-center">
                <div className={cn(
                  "w-[calc(50%-2rem)] sm:w-[calc(50%-2.5rem)]",
                  isLeft ? "order-1" : "order-3",
                )}>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e): void => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpen();
                      }
                    }}
                    onClick={handleOpen}
                    className={cn(
                      "group cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200",
                      locked && "opacity-70",
                      status === "completed" && "border-primary-500/70 bg-primary-500/5 hover:border-primary-500 hover:shadow-[0_0_25px_rgba(34,211,238,0.18)]",
                      status === "current" && "border-success-500 bg-success-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-success-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.22)]",
                      status === "upcoming" && "border-neutral-200 bg-neutral-50 hover:border-primary-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.18)] dark:border-neutral-700 dark:bg-neutral-800/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                        <span className="text-lg font-black text-primary-500">{unit.displayOrder}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                          {unit.title || `الوحدة ${unit.displayOrder}`}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {unit.description || `${unit.lessons.length} دروس`}
                        </p>
                      </div>
                      {isLeft ? <ChevronLeft className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:-translate-x-1" /> : <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />}
                    </div>

                    {pct > 0 && pct < 100 && (
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <div className="h-full rounded-full bg-gradient-to-l from-primary-500 to-success-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}

                    {locked && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-500">
                        <Lock className="h-3 w-3" />
                        <span>مقفول - افتح باستخدام العملات</span>
                      </div>
                    )}
                  </div>

                  {locked && (
                    <UnitLockOverlay
                      unitId={unit.id}
                      unitTitle={unit.title}
                      open={openUnitId === unit.id}
                      onOpenChange={(o) => { setOpenUnitId(o ? unit.id : null); }}
                    />
                  )}
                </div>

                <div className="order-2 z-10 flex w-10 shrink-0 items-center justify-center sm:w-12">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10",
                    status === "completed" && "border-primary-500 bg-primary-500 shadow-[0_0_12px_rgba(34,211,238,0.35)]",
                    status === "current" && "border-success-500 bg-success-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]",
                    status === "upcoming" && "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800",
                  )}>
                    {status === "completed" ? (
                      <svg className="h-4 w-4 text-white sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : status === "current" ? (
                      <span className="text-xs font-black text-white sm:text-sm">{unit.displayOrder}</span>
                    ) : (
                      <span className="text-xs font-bold text-neutral-400 sm:text-sm">{unit.displayOrder}</span>
                    )}
                  </div>
                </div>

                <div className={cn(
                  "w-[calc(50%-2rem)] sm:w-[calc(50%-2.5rem)]",
                  isLeft ? "order-3" : "order-1",
                )}>
                  {status === "current" && (
                    <div className={cn(
                      "flex",
                      isLeft ? "justify-start" : "justify-end",
                    )}>
                      <span className="inline-block rounded-full bg-success-500 px-3 py-1 text-[11px] font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.35)]">
                        أنت هنا 👇
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UnitsSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-64" />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-[calc(50%-2rem)]">
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
            <div className="flex w-10 shrink-0 items-center justify-center sm:w-12">
              <Skeleton className="h-8 w-8 rounded-full sm:h-10 sm:w-10" />
            </div>
            <div className="w-[calc(50%-2rem)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
