"use client";

import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/providers/auth-provider";
import { usePermissions } from "@/lib/use-permissions";
import { getSidebarModules } from "@/lib/nav-registry";
import {
  LogOut,
  ScrollText,
  Home,
  BookOpen,
  UserCircle,
  ClipboardList,
  GraduationCap,
  Sparkles,
  Video,
  Gamepad2,
} from "lucide-react";
import { type SidebarContent } from "@/components/ui/sidebar";
import { type BottomNavItem } from "@/components/ui/bottom-nav";

const Sidebar = dynamic(() => import("@/components/ui/sidebar").then(m => ({ default: m.Sidebar })), { ssr: false });
const Header = dynamic(() => import("@/components/ui/header").then(m => ({ default: m.Header })), { ssr: false });
const BottomNav = dynamic(() => import("@/components/ui/bottom-nav").then(m => ({ default: m.BottomNav })), { ssr: false });
const AcademicSettings = dynamic(() => import("@/components/ui/academic-settings").then(m => ({ default: m.AcademicSettings })), { ssr: false });
const ToastContainer = dynamic(() => import("@/components/toast").then(m => ({ default: m.ToastContainer })), { ssr: false });
const PwaInstallPrompt = dynamic(() => import("@/components/pwa-install-prompt").then(m => ({ default: m.PwaInstallPrompt })), { ssr: false });
const NotificationPrompt = dynamic(() => import("@/components/notification-prompt").then(m => ({ default: m.NotificationPrompt })), { ssr: false });

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: "مدير النظام",
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

      for (const m of modules) {
        if (!m || typeof m !== "object") continue;
        if (m.id === "home") {
          items.push({ id: m.id, label: m.title, icon: m.icon, onClick: (): void => { router.push(m.route); } });
          continue;
        }

        if (m.id === "achievements" && userRole !== "STUDENT") {
          continue;
        }

        items.push({
          id: m.id,
          label: m.title,
          icon: m.icon,
          onClick: m.route ? (): void => { router.push(m.route); } : undefined,
        });
      }

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

    if (isStudent) {
      items.push(
        { id: "courses", label: "الوحدات", icon: BookOpen, onClick: (): void => { router.push("/dashboard/units"); }, active: isActive("/dashboard/units") },
        { id: "ai", label: "البنا AI", icon: Sparkles, onClick: (): void => { router.push("/dashboard/ai"); }, active: isActive("/dashboard/ai") },
        { id: "home", label: "الرئيسية", icon: Home, onClick: (): void => { router.push("/dashboard"); }, active: pathname === "/dashboard" },
        { id: "live", label: "حصه مباشر", icon: Video, onClick: (): void => { router.push("/dashboard/live"); }, active: isActive("/dashboard/live") },
        { id: "games", label: "الألعاب", icon: Gamepad2, onClick: (): void => { router.push("/dashboard/games"); }, active: isActive("/dashboard/games") },
      );
    } else if (isTeacher) {
      items.push(
        { id: "home", label: "الرئيسية", icon: Home, onClick: (): void => { router.push("/dashboard"); }, active: pathname === "/dashboard" },
        { id: "units", label: "الوحدات", icon: BookOpen, onClick: (): void => { router.push("/dashboard/units"); }, active: isActive("/dashboard/units") },
        { id: "homework", label: "الواجبات", icon: ClipboardList, onClick: (): void => { router.push("/dashboard/teacher/homework"); }, active: isActive("/dashboard/teacher/homework") },
        { id: "quizzes", label: "الاختبارات", icon: GraduationCap, onClick: (): void => { router.push("/dashboard/teacher/quiz"); }, active: isActive("/dashboard/teacher/quiz") },
        { id: "students", label: "الطلاب", icon: UserCircle, onClick: (): void => { router.push("/dashboard/students"); }, active: isActive("/dashboard/students") },
        { id: "profile", label: "الحساب", icon: UserCircle, onClick: (): void => { router.push("/dashboard/profile"); }, active: isActive("/dashboard/profile") },
      );
    } else {
      items.push(
        { id: "home", label: "الرئيسية", icon: Home, onClick: (): void => { router.push("/dashboard"); }, active: pathname === "/dashboard" },
        { id: "units", label: "الوحدات", icon: BookOpen, onClick: (): void => { router.push("/dashboard/units"); }, active: isActive("/dashboard/units") },
        { id: "students", label: "الطلاب", icon: UserCircle, onClick: (): void => { router.push("/dashboard/students"); }, active: isActive("/dashboard/students") },
        { id: "settings", label: "الإعدادات", icon: ScrollText, onClick: (): void => { router.push("/dashboard/admin/settings"); }, active: isActive("/dashboard/admin/settings") },
        { id: "profile", label: "الحساب", icon: UserCircle, onClick: (): void => { router.push("/dashboard/profile"); }, active: isActive("/dashboard/profile") },
      );
    }

    return items;
  }, [router, pathname, userRole]);

  const toggleSidebar = useCallback((): void => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback((): void => {
    setSidebarOpen(false);
  }, []);

  const closeAndNavigate = useCallback((fn?: () => void): (() => void) | undefined => {
    if (!fn) return undefined;
    return (): void => { fn(); closeSidebar(); };
  }, [closeSidebar]);

  const sidebarContent = (
    <Sidebar
      items={sidebarItems}
      onClose={closeSidebar}
      onToggle={toggleSidebar}
      onProfileClick={closeAndNavigate((): void => { router.push("/dashboard/profile"); })}
      profileGrade={profileGrade}
      closeOnCollapse
    >
      {isTeacherOrStaff && <AcademicSettings />}
    </Sidebar>
  );

  const SIDEBAR_WIDTH = 280;

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 shadow-2xl lg:hidden"
            style={{ width: `${SIDEBAR_WIDTH}px` }}
            aria-label="القائمة الجانبية"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop persistent sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:shrink-0"
        style={{ width: `${SIDEBAR_WIDTH}px` }}
        aria-label="القائمة الجانبية"
      >
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="relative z-30 flex min-h-screen flex-1 flex-col bg-neutral-50 dark:bg-neutral-950">
        <Header
          title="لوحة التحكم"
          onMenuClick={toggleSidebar}
          onNotificationClick={(): void => { router.push("/dashboard/notifications"); }}
        />

        <main id="main-content" className="flex-1 overflow-y-auto p-4 pb-[calc(var(--bottom-nav-height)+var(--safe-area-bottom)+8px)] lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden" aria-label="التنقل السفلي">
        <BottomNav items={bottomNavItems} centerId="home" />
      </nav>

      <PwaInstallPrompt />
      <NotificationPrompt />
      <ToastContainer />
    </div>
  );
}
