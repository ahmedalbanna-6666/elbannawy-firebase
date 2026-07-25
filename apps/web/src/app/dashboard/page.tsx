"use client";

import { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePermissions } from "@/lib/use-permissions";
import { useAuthStore } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldX } from "lucide-react";

const AdminDashboard = dynamic(() => import("./_components/admin-dashboard").then((m) => ({ default: m.AdminDashboard })), {
  loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
});

const TeacherDashboard = dynamic(() => import("./_components/teacher-dashboard").then((m) => ({ default: m.TeacherDashboard })), {
  loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
});

const StudentDashboard = dynamic(() => import("./_components/student-dashboard").then((m) => ({ default: m.StudentDashboard })), {
  loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
});

const KNOWN_ROLES = new Set(["ADMINISTRATOR", "TEACHER", "STAFF", "STUDENT"]);

export default function DashboardPage(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const rawRole = user?.role;
  const { isAdmin, isTeacher, isStaff } = usePermissions();

  if (typeof rawRole !== "string") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isTeacher) {
    return <TeacherDashboard />;
  }

  if (isStaff) {
    return (
      <EmptyState
        title="لوحة الموظف"
        description="تجربة الموظف قيد التطوير. سيتم تفعيلها في التحديث القادم."
        icon={<ShieldX className="h-16 w-16" />}
      />
    );
  }

  if (!KNOWN_ROLES.has(rawRole.toUpperCase())) {
    return (
      <EmptyState
        title="دور غير مدعوم"
        description={`الدور "${rawRole}" غير مدعوم في الإصدار الحالي. يرجى التواصل مع الإدارة.`}
        icon={<ShieldX className="h-16 w-16" />}
      />
    );
  }

  return <StudentDashboard />;
}
