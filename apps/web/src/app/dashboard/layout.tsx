"use client";

import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/providers/auth-provider";
import { usePermissions } from "@/lib/use-permissions";
import { getSidebarModules, type NavModule } from "@/lib/nav-registry";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicSettings } from "@/components/ui/academic-settings";
import {
  Home,
  BookOpen,
  ScrollText,
  LogOut,
  UserCircle,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { Sidebar, type SidebarContent } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { BottomNav, type BottomNavItem } from "@/components/ui/bottom-nav";
import { ToastContainer } from "@/components/toast";

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: "مدير",
  TEACHER: "معلم",
  STAFF: "موظف",
  STUDENT: "طالب",
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps): ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const userId = useAuthStore((s) => s.user?.id);
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  const { data: profile } = useQuery<{
    role: string;
    roleProfile?: { grade?: { name: string } | null; stage?: { name: string } | null };
    assignedGrade?: { name: string; stage: { name: string } } | null;
  } | null>({
    queryKey: ["sidebar-profile", userId],
    queryFn: async () => {
      const res = await api.get<Record<string, unknown>>("/profile");
      if (!res.data) return null;
      const data = res.data;
      return data as { role: string; roleProfile?: { grade?: { name: string } | null; stage?: { name: string } | null }; assignedGrade?: { name: string; stage: { name: string } } | null };
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 120_000,
  });

  const userRole = (useAuthStore((s) => s.user?.role) ?? "").toUpperCase();

  const profileGrade = userRole === "STUDENT"
    ? (profile?.roleProfile?.grade?.name
      ?? profile?.roleProfile?.stage?.name
      ?? "طالب")
    : (ROLE_LABELS[userRole] ?? "طالب");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !profile) return;
    const role = (profile.role ?? "").toLowerCase();
    const hasGrade = !!(profile.assignedGrade);
    if (role === "student" && !hasGrade) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, userId, profile, router]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return (): void => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sidebarOpen]);

  const isTeacherOrStaff = userRole === "TEACHER" || userRole === "STAFF";

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
  }, [logout]);

  const { can } = usePermissions();

  const sidebarItems: SidebarContent = useMemo(
    () => {
      const raw = getSidebarModules(can);
      const modules = Array.isArray(raw) ? raw : [];
      const items: SidebarContent = [];
      let lastCategory: NavModule["category"] = null;
      let dividerCount = 0;

      for (const m of modules) {
        if (!m || typeof m !== "object") continue;
        if (m.id === "home") {
          items.push({ id: m.id, label: m.title, icon: m.icon, onClick: (): void => { router.push(m.route); } });
          lastCategory = null;
          continue;
        }

        if (m.id === "achievements" && userRole !== "STUDENT") {
          continue;
        }

        if (m.category === "student" && lastCategory !== "student") {
          dividerCount += 1;
          items.push({ id: `div-student-${String(dividerCount)}`, label: "", icon: ScrollText, divider: true });
        } else if (m.category === "management" && lastCategory !== "management" && lastCategory !== "content") {
          dividerCount += 1;
          items.push({ id: `div-management-${String(dividerCount)}`, label: "", icon: ScrollText, divider: true });
        } else if (m.category === "settings" && lastCategory !== "settings") {
          dividerCount += 1;
          items.push({ id: `div-settings-${String(dividerCount)}`, label: "", icon: ScrollText, divider: true });
        }

        const label = m.title;

        items.push({
          id: m.id,
          label,
          icon: m.icon,
          onClick: m.route ? (): void => { router.push(m.route); } : undefined,
        });

        lastCategory = m.category;
      }

      dividerCount += 1;
      items.push({ id: `div-logout-${String(dividerCount)}`, label: "", icon: ScrollText, divider: true });
      items.push({ id: "logout", label: "تسجيل الخروج", icon: LogOut, onClick: handleLogout, danger: true });

      return items;
    },
    [router, handleLogout, can],
  );

  const pathname = usePathname();

  const isActive = (route: string): boolean => pathname === route || pathname.startsWith(route + "/");

  const bottomNavItems: BottomNavItem[] = useMemo(() => {
    const isStudent = userRole === "STUDENT";
    const isTeacher = userRole === "TEACHER" || userRole === "STAFF";

    const items: BottomNavItem[] = [];

    items.push({ id: "home", label: "الرئيسية", icon: Home, onClick: (): void => { router.push("/dashboard"); }, active: pathname === "/dashboard" });

    if (isStudent) {
      items.push(
        { id: "courses", label: "الكورسات", icon: BookOpen, onClick: (): void => { router.push("/dashboard/units"); }, active: isActive("/dashboard/units") },
      );
    } else if (isTeacher) {
      items.push(
        { id: "units", label: "الوحدات", icon: BookOpen, onClick: (): void => { router.push("/dashboard/units"); }, active: isActive("/dashboard/units") },
        { id: "homework", label: "الواجبات", icon: ClipboardList, onClick: (): void => { router.push("/dashboard/teacher/homework"); }, active: isActive("/dashboard/teacher/homework") },
        { id: "quizzes", label: "الاختبارات", icon: GraduationCap, onClick: (): void => { router.push("/dashboard/teacher/quiz"); }, active: isActive("/dashboard/teacher/quiz") },
        { id: "students", label: "الطلاب", icon: UserCircle, onClick: (): void => { router.push("/dashboard/students"); }, active: isActive("/dashboard/students") },
      );
    } else {
      items.push(
        { id: "units", label: "الوحدات", icon: BookOpen, onClick: (): void => { router.push("/dashboard/units"); }, active: isActive("/dashboard/units") },
        { id: "students", label: "الطلاب", icon: UserCircle, onClick: (): void => { router.push("/dashboard/students"); }, active: isActive("/dashboard/students") },
        { id: "settings", label: "الإعدادات", icon: ScrollText, onClick: (): void => { router.push("/dashboard/admin/settings"); }, active: isActive("/dashboard/admin/settings") },
      );
    }

    items.push({ id: "profile", label: "الحساب", icon: UserCircle, onClick: (): void => { router.push("/dashboard/profile"); }, active: isActive("/dashboard/profile") });

    return items;
  }, [router, pathname, userRole]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={sidebarItems}
        className="hidden lg:flex"
        onClose={(): void => { setSidebarOpen(false); }}
        onProfileClick={(): void => { router.push("/dashboard/profile"); }}
        profileGrade={profileGrade}
      >
        {isTeacherOrStaff && <AcademicSettings />}
      </Sidebar>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm [animation:sidebar-backdrop-in_0.2s_ease]"
            onClick={(): void => { setSidebarOpen(false); }}
          />
          <Sidebar
            items={sidebarItems}
            className="fixed inset-y-0 right-0 z-50 h-screen w-[280px] shadow-2xl [animation:sidebar-slide-in_0.25s_ease]"
            onClose={(): void => { setSidebarOpen(false); }}
            onProfileClick={(): void => { router.push("/dashboard/profile"); }}
            profileGrade={profileGrade}
          >
            {isTeacherOrStaff && <AcademicSettings />}
          </Sidebar>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <Header
          title="لوحة التحكم"
          onMenuClick={(): void => { setSidebarOpen(!sidebarOpen); }}
          onNotificationClick={(): void => { router.push("/dashboard/notifications"); }}
        />

        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>

        <BottomNav items={bottomNavItems} />
        <ToastContainer />
      </div>
    </div>
  );
}
