"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CardEdge } from "@/components/ui/card-edge";
import { GraduationCap, UserCog, ChevronLeft } from "lucide-react";

export default function AdminUsersPage(): ReactNode {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">إدارة المستخدمين</h1>
        <p className="mt-1 text-sm text-neutral-500">إدارة الطلاب والمعلمين المسجلين في المنصة</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          variant="elevated"
          padding="none"
          className="relative cursor-pointer transition-shadow duration-300 hover:scale-[1.005] hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.12)] dark:hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.18)]"
          onClick={() => { router.push("/dashboard/students"); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e): void => { if (e.key === "Enter") router.push("/dashboard/students"); }}
        >
          <CardEdge variant="primary" />
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/10">
              <GraduationCap className="h-5 w-5 text-primary-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">الطلاب</h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                عرض وإدارة الطلاب المسجلين — بحث، تصفية، وعرض تفاصيل كل طالب
              </p>
            </div>
            <div className="flex items-center justify-end">
              <ChevronLeft className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </Card>

        <Card
          variant="elevated"
          padding="none"
          className="relative cursor-pointer transition-shadow duration-300 hover:scale-[1.005] hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.12)] dark:hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.18)]"
          onClick={() => { router.push("/dashboard/teachers"); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e): void => { if (e.key === "Enter") router.push("/dashboard/teachers"); }}
        >
          <CardEdge variant="orange" />
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/10">
              <UserCog className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">المعلمون</h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                إدارة المعلمين والصلاحيات الدراسية — إنشاء، تعديل، صلاحيات، والصفوف المسندة
              </p>
            </div>
            <div className="flex items-center justify-end">
              <ChevronLeft className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
