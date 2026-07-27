"use client";

import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Video,
  Gamepad2,
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
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const router = useRouter();
  const { isAuthenticated, hasHydrated, authReady } = useAuthStore();
  const userId = useAuthStore((s) => s.user?.id);
  const { logout } = useAuth();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent): void => { setIsDesktop(e.matches); };
    mq.addEventListener("change", handler);
    return (): void => mq.removeEventListener("change", handler);
  }, []);

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  const mobileSidebar = (
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

  const desktopSidebar = (
    <Sidebar
      items={sidebarItems}
      onClose={(): void => {}}
      onToggle={(): void => {}}
      onProfileClick={(): void => { router.push("/dashboard/profile"); }}
      profileGrade={profileGrade}
    >
      {isTeacherOrStaff && <AcademicSettings />}
    </Sidebar>
  );

  const SIDEBAR_WIDTH = 300;
  const CONTENT_SCALE = 0.85;
  const CONTENT_RADIUS = 20;
  const contentAnimate = !isDesktop && sidebarOpen ? {
    scale: CONTENT_SCALE,
    x: `-${SIDEBAR_WIDTH * 0.15}px`,
    borderRadius: `${CONTENT_RADIUS}px`,
    boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
    rotateY: "-3deg",
    overflow: "hidden",
    marginTop: "12px",
    marginBottom: "12px",
    height: "calc(100vh - 24px)",
  } : {
    scale: 1,
    x: "0px",
    borderRadius: "0px",
    rotateY: "0deg",
    boxShadow: "0 0 0 rgba(0,0,0,0)",
    marginTop: "0px",
    marginBottom: "0px",
    height: "auto",
    overflow: "visible",
  };

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Desktop persistent sidebar */}
      {isDesktop && (
        <div className="hidden lg:flex lg:shrink-0">
          {desktopSidebar}
        </div>
      )}

      {/* Mobile drawer + 3D animation */}
      <div className="flex flex-1 flex-col" style={{ perspective: !isDesktop ? "1400px" : undefined }}>
        {!isDesktop && (
          <>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  key="sidebar-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="fixed inset-0 z-40 bg-black"
                  onClick={closeSidebar}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  key="sidebar-drawer"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
                  className="fixed inset-y-0 right-0 z-50 shadow-2xl"
                  style={{ width: `${SIDEBAR_WIDTH}px` }}
                >
                  {mobileSidebar}
                </motion.aside>
              )}
            </AnimatePresence>
          </>
        )}

        <motion.div
          animate={contentAnimate}
          transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
          style={{ originX: 1, originY: 0.5 }}
          className="relative z-30 flex flex-1 flex-col bg-neutral-50 dark:bg-neutral-950"
        >
          <Header
            title="لوحة التحكم"
            onMenuClick={toggleSidebar}
            onNotificationClick={(): void => { router.push("/dashboard/notifications"); }}
          />

          <main className="flex-1 overflow-y-auto p-4 pb-[88px]">
            {children}
          </main>
        </motion.div>
      </div>

      {mounted && createPortal(<BottomNav items={bottomNavItems} centerId="home" />, document.body)}
      <PwaInstallPrompt />
      <NotificationPrompt />
      <ToastContainer />
    </div>
  );
}
