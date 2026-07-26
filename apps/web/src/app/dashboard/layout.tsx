"use client";

import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/providers/auth-provider";
import { usePermissions } from "@/lib/use-permissions";
import { getSidebarModules, type NavModule } from "@/lib/nav-registry";
import {
  LogOut,
  ScrollText,
  Home,
  BookOpen,
  UserCircle,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type SidebarContent } from "@/components/ui/sidebar";
import { type BottomNavItem } from "@/components/ui/bottom-nav";

const Sidebar = dynamic(() => import("@/components/ui/sidebar").then(m => ({ default: m.Sidebar })), { ssr: false });
const Header = dynamic(() => import("@/components/ui/header").then(m => ({ default: m.Header })), { ssr: false });
const BottomNav = dynamic(() => import("@/components/ui/bottom-nav").then(m => ({ default: m.BottomNav })), { ssr: false });
const AcademicSettings = dynamic(() => import("@/components/ui/academic-settings").then(m => ({ default: m.AcademicSettings })), { ssr: false });
const ToastContainer = dynamic(() => import("@/components/toast").then(m => ({ default: m.ToastContainer })), { ssr: false });
const PwaInstallPrompt = dynamic(() => import("@/components/pwa-install-prompt").then(m => ({ default: m.PwaInstallPrompt })), { ssr: false });

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
  const { isAuthenticated, hasHydrated, authReady } = useAuthStore();
  const userId = useAuthStore((s) => s.user?.id);
  const { logout } = useAuth();

  const { data: profile } = useQuery<{
    role: string;
    roleProfile?: { grade?: { name: string; stage: { name: string } } | null; stage?: { name: string } | null };
  } | null>({
    queryKey: ["sidebar-profile", userId],
    queryFn: async () => {
      const res = await api.get<Record<string, unknown>>("/profile");
      if (!res.data) return null;
      const data = res.data;
      return data as { role: string; roleProfile?: { grade?: { name: string; stage: { name: string } } | null; stage?: { name: string } | null } };
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 120_000,
    gcTime: 0,
  });

  const userRole = (useAuthStore((s) => s.user?.role) ?? "").toUpperCase();

  const profileGrade = useMemo(() => userRole === "STUDENT"
    ? (profile?.roleProfile?.grade?.name
      ?? profile?.roleProfile?.stage?.name
      ?? "طالب")
    : (ROLE_LABELS[userRole] ?? "طالب"),
  [userRole, profile?.roleProfile?.grade?.name, profile?.roleProfile?.stage?.name]);

  useEffect(() => {
    if (!hasHydrated || !authReady) return;
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, authReady, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !profile) return;
    const role = (profile.role ?? "").toLowerCase();
    const hasGrade = !!(profile.roleProfile?.grade);
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

  const toggleSidebar = useCallback((): void => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback((): void => {
    setSidebarOpen(false);
  }, []);

  const sidebarContent = (
    <Sidebar
      items={sidebarItems}
      onClose={closeSidebar}
      onToggle={toggleSidebar}
      onProfileClick={(): void => { router.push("/dashboard/profile"); closeSidebar(); }}
      profileGrade={profileGrade}
    >
      {isTeacherOrStaff && <AcademicSettings />}
    </Sidebar>
  );

  return (
    <div className="flex min-h-screen">
      {/* Overlay sidebar - same for mobile and desktop */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-all duration-300",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 transition-all duration-300",
            sidebarOpen ? "bg-black/60 backdrop-blur-sm opacity-100" : "bg-transparent opacity-0",
          )}
          onClick={closeSidebar}
        />
        <div className={cn(
          "absolute inset-y-0 right-0 z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full",
        )}>
          {sidebarContent}
        </div>
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarOpen && "lg:origin-right lg:scale-[0.92] lg:rounded-[20px] lg:overflow-hidden lg:shadow-2xl lg:ring-1 lg:ring-white/10 lg:mx-auto lg:my-3 lg:h-[calc(100vh-24px)] lg:max-w-[calc(100%-270px)]",
        )}
      >
        <Header
          title="لوحة التحكم"
          onMenuClick={toggleSidebar}
          onNotificationClick={(): void => { router.push("/dashboard/notifications"); }}
        />

        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>

        <BottomNav items={bottomNavItems} />
        <PwaInstallPrompt />
        <ToastContainer />
      </div>
    </div>
  );
}
