"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { startPageLoad, endPageLoad, printSummary } from "@/lib/performance/metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardEdge } from "@/components/ui/card-edge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { AnimatedContainer, StaggerList } from "@/components/ui/animated-container";
import {
  Sparkles,
  GraduationCap,
  Play,
  BookOpen,
  ScrollText,
  RefreshCw,
  Trophy,
  Gamepad2,
  BookMarked,
  ChevronRight,
  Users,
  Video,
} from "lucide-react";
import { useMyBookings } from "@/lib/live-api";

export interface DashboardData {
  user: { id: string; fullName: string; role: string };
  xp: { total: number; level: number; nextLevelXp: number };
  coins: number;
  achievements: number;
  streak: number;
  continueLearning: { unitName: string; lessonName: string; progress: number; lessonId: string } | null;
  recentActivity: { id: string; type: string; description: string; createdAt: string }[];
  upcomingLiveClasses: { id: string; title: string; date: string; teacherName: string }[];
  stats: { completedLessons: number; totalLessons: number; homeworkPending: number; quizPassRate: number; attendanceRate: number };
}

export function StudentDashboard(): ReactNode {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => { startPageLoad("dashboard"); }, []);
  const { data: liveBookings } = useMyBookings();
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["home-dashboard"],
    queryFn: async () => {
      const response = await api.get<DashboardData>("/home");
      if (!response.data) throw new Error("فشل تحميل لوحة التحكم");
      return response.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isLoading && data) {
      endPageLoad("dashboard");
      printSummary();
      queryClient.prefetchQuery({
        queryKey: ["curriculum"],
        queryFn: async () => {
          const res = await api.get("/curriculum");
          return res.data ?? [];
        },
        staleTime: 300_000,
      });
    }
  }, [isLoading, data, queryClient]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState title="فشل تحميل لوحة التحكم" description={error instanceof Error ? error.message : "فشل تحميل لوحة التحكم"} />;
  }

  if (!data) {
    return <EmptyState title="لا توجد بيانات" description="لا توجد بيانات متاحة للوحة التحكم" icon={<BookOpen className="h-16 w-16" />} />;
  }

  return (
    <div className="flex flex-col gap-5">

      {/* SECTION 1 — Continue / Start Learning */}
      {/* SECTION 1 — Continue / Start Learning */}
      <section>
        <Card variant="outline" padding="none" className="overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <div className="bg-white px-5 py-4 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                {data.continueLearning ? (
                  <>
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20">
                        <Play className="h-3 w-3 text-violet-500" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">واصل التعلم</span>
                    </div>
                    <h2 className="truncate text-sm font-bold text-neutral-900 dark:text-white">
                      {data.continueLearning.unitName}
                    </h2>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {data.continueLearning.lessonName}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10">
                      <GraduationCap className="h-6 w-6 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">ابدأ رحلتك التعليمية</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">اختر وحدة وتابع تقدمك خطوة بخطوة</p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                className="shrink-0 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700"
                onClick={() => {
                  if (data.continueLearning?.lessonId) {
                    router.push(`/dashboard/lessons/detail/${data.continueLearning.lessonId}`);
                  } else {
                    router.push("/dashboard/units");
                  }
                }}
              >
                <Play className="h-3.5 w-3.5" />
                {data.continueLearning ? "استكمل" : "ابدأ الآن"}
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 shrink-0 text-violet-500" />
              <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${String(Math.min(Math.max(data.continueLearning?.progress ?? 0, 2), 100))}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-bold text-violet-700 dark:text-violet-300" style={{ minWidth: '40px', textAlign: 'right' as const }}>
                {Math.round(data.continueLearning?.progress ?? 0)}%
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* SECTION 2 — Curriculum Units */}
      <div onClick={(): void => { router.push("/dashboard/units"); }} role="button" tabIndex={0} onKeyDown={(e): void => { if (e.key === "Enter") { router.push("/dashboard/units"); } }}>
      <Card variant="outline" padding="md" className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
              <BookOpen className="h-6 w-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">الوحدات التعليمية</h3>
              <p className="text-sm text-neutral-500">تصفح جميع الوحدات وتابع تقدمك</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* SECTION 3 — Story */}
      <div onClick={(): void => { router.push("/dashboard/story"); }} role="button" tabIndex={0} onKeyDown={(e): void => { if (e.key === "Enter") { router.push("/dashboard/story"); } }}>
      <Card variant="outline" padding="md" className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <ScrollText className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">قصة المنهج</h3>
              <p className="text-sm text-neutral-500">تابع قصة المنهج التعليمي</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* SECTION 4 — Final Review */}
      <div onClick={(): void => { router.push("/dashboard/final-review"); }} role="button" tabIndex={0} onKeyDown={(e): void => { if (e.key === "Enter") { router.push("/dashboard/final-review"); } }}>
      <Card variant="outline" padding="md" className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <BookMarked className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">المراجعة النهائية</h3>
              <p className="text-sm text-neutral-500">راجع المنهج بالكامل واستعد للاختبارات</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
        </CardContent>
      </Card>
      </div>


      {/* SECTION 5 — Live Classes */}
      {liveBookings && liveBookings.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              الحصص المباشرة القادمة
            </h2>
            <button
              onClick={(): void => { router.push("/dashboard/live"); }}
              className="text-xs font-medium text-primary-500 hover:text-primary-600"
            >
              عرض الكل
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {liveBookings.slice(0, 2).map((booking) => {
              const startDate = new Date(booking.session.startTime);
              const isToday =
                startDate.toDateString() === new Date().toDateString();
              return (
                <div
                  key={booking.id}
                  onClick={(): void => {
                    router.push(`/dashboard/live/sessions/${booking.session.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      router.push(
                        `/dashboard/live/sessions/${booking.session.id}`,
                      );
                  }}
                >
                  <Card
                    variant={isToday ? "elevated" : "outline"}
                    padding="md"
                    className={`cursor-pointer transition-all ${
                      isToday
                        ? "border-success-500/30 shadow-success-500/5"
                        : ""
                    }`}
                  >
                    {isToday && <CardEdge variant="primary" />}
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                          <Video className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {booking.session.title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {booking.session.teacher.name} ·{" "}
                            {startDate.toLocaleDateString("ar-SA", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            ·{" "}
                            {startDate.toLocaleTimeString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {isToday && (
                          <span className="shrink-0 text-xs font-bold text-success-500">
                            اليوم
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 6 — Quick Learning Tools */}
      <AnimatedContainer animation="fade-slide-up" delay={120}>
        <section className="grid grid-cols-2 gap-3 sm:gap-4">

        <ToolCard icon={Sparkles} label="اسأل البنا AI" color="bg-gradient-to-br from-purple-500 to-pink-500" textColor="text-white" onClick={(): void => { router.push("/dashboard/ai"); }} />
        <ToolCard icon={Users} label="احجز حصة مباشرة" color="bg-success-500/10" textColor="text-success-500" onClick={(): void => { router.push("/dashboard/live"); }} />
        <ToolCard icon={RefreshCw} label="تعلم من أخطائك" color="bg-danger-500/10" textColor="text-danger-500" onClick={(): void => { router.push("/dashboard/mistakes"); }} />
        <ToolCard icon={Gamepad2} label="الألعاب التعليمية" color="bg-purple-500/10" textColor="text-purple-500" onClick={(): void => { router.push("/dashboard/games"); }} />

      </section>
      </AnimatedContainer>

    </div>
  );
}

function ToolCard({ icon: Icon, label, color, textColor, onClick }: { icon: typeof Sparkles; label: string; color: string; textColor: string; onClick: () => void }): ReactNode {
  return (
    <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e): void => { if (e.key === "Enter") onClick(); }}>
      <Card variant="outline" padding="sm" className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 h-full">
        <CardContent>
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className={`h-5 w-5 ${textColor}`} />
            </div>
            <span className="text-xs font-semibold text-center text-neutral-900 dark:text-neutral-100 leading-tight">
              {label}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}
