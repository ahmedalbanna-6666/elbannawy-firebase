"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/lib/use-permissions";
import { useAuthStore } from "@/lib/auth-store";
import { getDashboardModules } from "@/lib/nav-registry";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { CardEdge } from "@/components/ui/card-edge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, GraduationCap, UserCog, BookOpen, Layers, BookMarked, Calendar } from "lucide-react";

interface DashboardStats {
  studentsCount: number;
  teachersCount: number;
  unitsCount: number;
  lessonsCount: number;
  academicYearsCount: number;
}

function formatTodayArabic(): string {
  return new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AdminDashboard(): ReactNode {
  const router = useRouter();
  const { can } = usePermissions();
  const fullName = useAuthStore((s) => s.user?.fullName ?? "");
  const firstName = fullName.split(" ")[0];

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<DashboardStats>("/admin/dashboard/stats");
      const fallback: DashboardStats = { studentsCount: 0, teachersCount: 0, academicYearsCount: 0 };
      return res.data ?? fallback;
    },
    refetchInterval: 60_000,
  });

  const modules = getDashboardModules(can) ?? [];
  const primaryModules = modules.filter((m) => m.category === "content");
  const moreModules = modules.filter((m) => m.category !== "content");

  const today = useMemo(() => formatTodayArabic(), []);

  const statsCards = [
    { label: "الطلاب", value: stats?.studentsCount ?? 0, icon: GraduationCap, color: "text-primary-500" },
    { label: "المعلمون", value: stats?.teachersCount ?? 0, icon: UserCog, color: "text-blue-500" },
    { label: "الوحدات", value: stats?.unitsCount ?? 0, icon: BookOpen, color: "text-green-500" },
    { label: "الدروس", value: stats?.lessonsCount ?? 0, icon: Layers, color: "text-purple-500" },
    { label: "السنوات الدراسية", value: stats?.academicYearsCount ?? 0, icon: Calendar, color: "text-rose-500" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          مرحباً، {firstName || "مدير"}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          لوحة تحكم النظام الأساسي — إدارة المحتوى التعليمي
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          {today}
        </p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {statsCards.map((stat) => (
            <Card key={stat.label} variant="elevated" padding="none">
              <div className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xs text-neutral-500">{stat.label}</span>
                </div>
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {stat.value}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {primaryModules.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">
            وحدات الإدارة الأساسية
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {primaryModules.map((m) => (
              <Card
                key={m.id}
                variant="elevated"
                padding="none"
                className="relative cursor-pointer transition-shadow duration-300 hover:scale-[1.005] hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.12)] dark:hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.18)]"
                onClick={(): void => { router.push(m.route); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e): void => { if (e.key === "Enter") router.push(m.route); }}
              >
                <CardEdge variant="primary" />
                <div className="flex flex-col gap-3 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/10">
                    <m.icon className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {m.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {m.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <ChevronLeft className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {moreModules.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-neutral-500 dark:text-neutral-400">
            المزيد من وحدات الإدارة
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {moreModules.map((m) => (
              <Card
                key={m.id}
                variant="elevated"
                padding="none"
                className="relative cursor-pointer transition-shadow duration-300 hover:scale-[1.005] hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.12)] dark:hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.18)]"
                onClick={(): void => { router.push(m.route); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e): void => { if (e.key === "Enter") router.push(m.route); }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50">
                    <m.icon className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {m.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {m.description}
                    </p>
                  </div>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-neutral-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
