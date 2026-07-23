"use client";

import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useAcademicContext } from "@/lib/academic-context-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TeacherContextBanner } from "@/components/ui/teacher-context-banner";
import {
  ClipboardList,
  GraduationCap,
  Clock,
  CheckCircle2,
  Repeat,
  Zap,
} from "lucide-react";

interface HomeworkItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  published: boolean;
  passingScore: number;
  maxAttempts: number;
  unlimitedAttempts: boolean;
  xpReward: number;
  createdAt: string;
}

interface HomeworkList {
  items: HomeworkItem[];
  total: number;
}

export default function TeacherHomeworkPage(): ReactNode {
  const userId = useAuthStore((s) => s.user?.id);
  const academicContext = useAcademicContext();

  const gradeId = academicContext.gradeId;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-homework", gradeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gradeId) params.set("gradeId", gradeId);
      const res = await api.get<HomeworkList>(`/teacher/homework?${params.toString()}`);
      return res.data ?? null;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  if (isLoading) return <HomeworkSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="فشل تحميل الواجبات"
        description={error instanceof Error ? error.message : "حدث خطأ غير متوقع"}
        onRetry={() => void refetch()}
      />
    );
  }

  const items = data?.items ?? [];

  const publishedCount = items.filter((h) => h.published).length;
  const totalCount = items.length;

  return (
    <div className="flex flex-col gap-6">
      <TeacherContextBanner />

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10">
          <ClipboardList className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            الواجبات
          </h1>
          <p className="text-sm text-neutral-500">
            إدارة ومتابعة واجبات الطلاب
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card variant="elevated" padding="md">
          <CardContent>
            <div className="flex flex-col items-center gap-2 text-center">
              <ClipboardList className="h-6 w-6 text-primary-500" />
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {totalCount}
              </p>
              <p className="text-xs text-neutral-500">إجمالي الواجبات</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" padding="md">
          <CardContent>
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-6 w-6 text-success-500" />
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {publishedCount}
              </p>
              <p className="text-xs text-neutral-500">منشورة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-16 w-16" />}
          title="لا توجد واجبات"
          description="لم يتم إنشاء أي واجبات بعد. يمكن إنشاؤها من صفحة الدروس."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((hw) => (
            <Card key={hw.id} variant="elevated" padding="none">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                  <ClipboardList className="h-5 w-5 text-primary-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {hw.title}
                    </h3>
                    <Badge
                      variant={hw.published ? "success" : "warning"}
                      className="text-[10px] shrink-0"
                    >
                      {hw.published ? "منشور" : "مسودة"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {hw.lessonTitle || "—"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      نسبة النجاح: {hw.passingScore}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="h-3 w-3" />
                      {hw.unlimitedAttempts ? "غير محدود" : `${hw.maxAttempts} محاولات`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {hw.xpReward} XP
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {hw.createdAt ? new Date(hw.createdAt).toLocaleDateString("ar-EG") : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function HomeworkSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
