"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import { PERMISSIONS } from "@el-bannawy/shared";
import { useAcademicContext } from "@/lib/academic-context-store";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TeacherContextBanner } from "@/components/ui/teacher-context-banner";
import {
  Trophy,
  Zap,
  GraduationCap,
  Medal,
  Crown,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";

interface LeaderboardStudent {
  id: string;
  fullName: string;
  mobileNumber: string | null;
  gradeId: string | null;
  xp: number;
  level: number;
  rank: number;
}

interface LeaderboardData {
  students: LeaderboardStudent[];
  stats: { total: number; avgXp: number };
  gradeId: string | null;
}

const RANK_STYLES: Record<number, { ring: string; bg: string; icon: ReactNode; label: string }> = {
  1: {
    ring: "ring-yellow-400/60",
    bg: "from-warning-400 to-amber-500",
    icon: <Crown className="h-4 w-4 text-yellow-500" />,
    label: "البطل",
  },
  2: {
    ring: "ring-neutral-300/60",
    bg: "from-neutral-200 to-neutral-400",
    icon: <Medal className="h-4 w-4 text-neutral-400" />,
    label: "الوصيف",
  },
  3: {
    ring: "ring-amber-700/50",
    bg: "from-amber-600 to-amber-800",
    icon: <Medal className="h-4 w-4 text-amber-700" />,
    label: "الثالث",
  },
};

export default function TeacherLeaderboardPage(): ReactNode {
  const userId = useAuthStore((s) => s.user?.id);
  const { can } = usePermissions();
  const academicContext = useAcademicContext();

  const gradeId = academicContext.gradeId;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-leaderboard", gradeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gradeId) params.set("gradeId", gradeId);
      params.set("limit", "200");
      const res = await api.get<LeaderboardData>(`/teacher/leaderboard?${params.toString()}`);
      return res.data ?? null;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="فشل تحميل قائمة العباقرة"
        description={error instanceof Error ? error.message : "حدث خطأ غير متوقع"}
        onRetry={() => void refetch()}
      />
    );
  }

  const students = data?.students ?? [];
  const stats = data?.stats ?? { total: 0, avgXp: 0 };
  const top3 = students.slice(0, 3);
  const rest = students.slice(3);

  return (
    <div className="flex flex-col gap-6">
      <TeacherContextBanner />

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10">
          <Trophy className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            إدارة العباقرة
          </h1>
          <p className="text-sm text-neutral-500">
            عرض ترتيب الطلاب وإدارة نقاط الخبرة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card variant="elevated" padding="md">
          <CardContent>
            <div className="flex flex-col items-center gap-2 text-center">
              <Users className="h-6 w-6 text-primary-500" />
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.total}
              </p>
              <p className="text-xs text-neutral-500">إجمالي الطلاب</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" padding="md">
          <CardContent>
            <div className="flex flex-col items-center gap-2 text-center">
              <TrendingUp className="h-6 w-6 text-success-500" />
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.avgXp.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500">متوسط XP</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" padding="md">
          <CardContent>
            <div className="flex flex-col items-center gap-2 text-center">
              <Trophy className="h-6 w-6 text-amber-500" />
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {students[0]?.xp.toLocaleString() ?? 0}
              </p>
              <p className="text-xs text-neutral-500">أعلى XP</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-16 w-16" />}
          title="لا يوجد طلاب بعد"
          description="سيظهر الطلاب هنا عندما يبدأون في حل الدروس والاختبارات."
        />
      ) : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-3 items-end gap-3">
              {([top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardStudent[]).map((student) => {
                const style = RANK_STYLES[student.rank];
                return (
                  <Card
                    key={student.id}
                    variant="elevated"
                    padding="none"
                    className={`relative flex flex-col items-center gap-2 p-4 ring-2 ${style?.ring ?? ""} ${student.rank === 1 ? "pb-8" : ""}`}
                  >
                    <span className="absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-neutral-700 shadow dark:bg-neutral-800 dark:text-neutral-100">
                      {student.rank}
                    </span>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${style?.bg ?? "from-primary-500 to-primary-600"} text-white`}>
                      <span className="text-lg font-bold">
                        {student.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-center text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {student.fullName}
                    </p>
                    <Badge variant="warning" className="text-[10px]">
                      <Star className="h-3 w-3" />
                      مستوى {student.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                      <Zap className="h-3.5 w-3.5" />
                      {student.xp.toLocaleString()} XP
                    </div>
                    {style && (
                      <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                        {style.icon}
                        {style.label}
                      </span>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Card variant="elevated" padding="none">
            <CardContent className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
              {rest.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="w-8 shrink-0 text-center text-sm font-extrabold text-neutral-400">
                    {student.rank}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-xs font-bold text-primary-600">
                    {student.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {student.fullName}
                    </p>
                    <Badge variant="secondary" className="mt-0.5 text-[10px]">
                      مستوى {student.level}
                    </Badge>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    <Zap className="h-3.5 w-3.5" />
                    {student.xp.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function LeaderboardSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
