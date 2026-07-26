"use client";

import { useState, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Facebook,
  MessageCircle,
  Send,
  Youtube,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_LABELS } from "@el-bannawy/shared";
import { usePwaInstall, isStandalone } from "@/lib/use-pwa-install";

/* ── Types ────────────────────────────────────────────────── */

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
  danger?: boolean;
  divider?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

type SidebarContent = (SidebarItem | SidebarSection)[];

interface SidebarProps {
  items: SidebarContent;
  className?: string;
  onClose?: () => void;
  onToggle?: () => void;
  onProfileClick?: () => void;
  profileGrade?: string;
  children?: ReactNode;
}

/* ── Helpers ──────────────────────────────────────────────── */

function isSection(item: SidebarItem | SidebarSection): item is SidebarSection {
  return "items" in item && Array.isArray(item.items);
}

function isDivider(item: SidebarItem): boolean {
  return item.divider === true;
}

/* ── Constants ────────────────────────────────────────────── */

const SOCIAL_LINKS = [
  { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-400" },
  { icon: MessageCircle, href: "#", label: "WhatsApp", color: "hover:text-green-400" },
  { icon: Send, href: "#", label: "Telegram", color: "hover:text-sky-400" },
  { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-400" },
];

const SPRING_FAST = { type: "spring" as const, stiffness: 400, damping: 25 };

/* ── Sub-Components ───────────────────────────────────────── */

function ProfileCard({ collapsed, onProfileClick, gradeLabel }: { collapsed?: boolean; onProfileClick?: () => void; gradeLabel: string }): ReactNode {
  const { user } = useAuthStore();
  const fullName = user?.fullName ?? "";
  const firstName = fullName ? fullName.split(" ")[0] : "";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || "User")}&background=22D3EE&color=fff&bold=true&font-size=0.33`;

  if (collapsed) {
    return (
      <div className="flex shrink-0 justify-center py-4">
        <motion.button
          onClick={onProfileClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={SPRING_FAST}
          className="relative"
        >
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-400 shadow-[0_0_14px_rgba(34,211,238,0.2)]">
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500">
            <User className="h-2.5 w-2.5 text-white" />
          </div>
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-2 mb-5 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl light:border-neutral-200 light:bg-black/3"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
    >
      <div className="p-3.5">
        <motion.button
          onClick={onProfileClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_FAST}
          className="group w-full text-right"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary-400 shadow-[0_0_16px_rgba(34,211,238,0.15)]">
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-neutral-100 light:text-neutral-900">
                {firstName || "User"}
              </span>
              <span className="truncate text-[11px] font-semibold text-neutral-400 light:text-neutral-600">
                {gradeLabel}
              </span>
            </div>
          </div>
        </motion.button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200" />

      <div className="px-3.5 py-2.5">
        <motion.button
          onClick={onProfileClick}
          whileHover={{ x: -3 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex w-full items-center justify-between text-xs font-bold text-primary-400 transition-colors hover:text-primary-300"
        >
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>الملف الشخصي</span>
          </span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function SocialDock({ collapsed }: { collapsed?: boolean }): ReactNode {
  if (collapsed) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="relative z-10 shrink-0 border-t border-white/5 px-4 py-3 light:border-neutral-200"
    >
      <div className="flex items-center justify-center gap-3">
        {SOCIAL_LINKS.map((social) => (
          <motion.a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING_FAST}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 light:text-neutral-600 transition-colors hover:bg-white/10 light:hover:bg-neutral-100",
              social.color,
            )}
          >
            <social.icon className="h-4 w-4" />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}

function InstallButton({ collapsed }: { collapsed?: boolean }): ReactNode {
  const { canInstall, install, dismissed } = usePwaInstall();

  if (dismissed || !canInstall) return null;

  if (collapsed) {
    return (
      <motion.button
        onClick={install}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 light:text-neutral-600 transition-colors hover:bg-primary-400/12 hover:text-primary-400"
        aria-label="تثبيت التطبيق"
      >
        <Smartphone className="h-5 w-5" />
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={install}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.97 }}
      className="flex w-full items-center gap-3 rounded-xl border border-primary-500/20 bg-primary-400/8 px-3 py-2.5 text-sm font-bold text-primary-400 transition-colors hover:bg-primary-400/15"
    >
      <Smartphone className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1 text-start text-[13px]">تثبيت التطبيق</span>
    </motion.button>
  );
}

/* ── Main Sidebar ─────────────────────────────────────────── */

export function Sidebar({ items, className, onClose, onToggle, onProfileClick, profileGrade, children }: SidebarProps): ReactNode {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

  const fallbackRole = (user?.role ?? "").toUpperCase();
  const gradeLabel = profileGrade ?? (user?.role ? ROLE_LABELS[fallbackRole] ?? fallbackRole : "Student");

  const handleItemClick = useCallback((item: SidebarItem): void => {
    if (item.divider) return;
    item.onClick?.();
    onClose?.();
  }, [onClose]);

  const activeClasses = "bg-primary-400/15 text-primary-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] before:absolute before:right-0 before:top-1/2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-primary-400 before:shadow-[0_0_8px_rgba(34,211,238,0.4)] light:bg-primary-400/10 light:shadow-none light:before:shadow-[0_0_6px_rgba(34,211,238,0.3)]";
  const hoverClasses = "text-neutral-300 hover:bg-white/10 hover:text-primary-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] light:text-neutral-700 light:hover:bg-neutral-100 light:hover:text-primary-600 light:hover:shadow-none";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 280 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
      className={cn(
        "flex h-screen flex-col overflow-hidden border-l border-white/8 bg-gradient-to-b from-neutral-950 to-neutral-950/95 backdrop-blur-2xl dark:from-neutral-950 dark:to-neutral-950/98 light:border-neutral-200 light:from-white light:to-neutral-50/95 will-change-[width]",
        collapsed ? "px-2" : "px-3",
        className,
      )}
    >
      {/* ── Top: collapse/close ── */}
      <div className={cn(
        "flex shrink-0 items-center",
        collapsed ? "justify-center py-5" : "justify-between px-2 pb-2 pt-5",
      )}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 light:text-neutral-600"
          >
            القائمة
          </motion.span>
        )}
        <motion.button
          onClick={collapsed ? (): void => { setCollapsed(false); } : (): void => { setCollapsed(true); }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={SPRING_FAST}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 light:text-neutral-600 transition-colors hover:bg-white/10 hover:text-white light:hover:bg-neutral-100 light:hover:text-neutral-700"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </motion.button>
      </div>

      {/* ── Profile Card ── */}
      <ProfileCard collapsed={collapsed} onProfileClick={onProfileClick} gradeLabel={gradeLabel} />

      {/* ── Navigation ── */}
      <nav className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1",
        "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]",
        "[&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/8 light:[&::-webkit-scrollbar-thumb]:bg-neutral-300",
      )}>
        <div className="flex flex-col gap-0.5">
          {Array.isArray(items) ? items.map((entry) => {
            if (!entry || typeof entry !== "object") return null;

            if (isSection(entry)) {
              const sectionItems = Array.isArray(entry.items) ? entry.items : [];
              return (
                <div key={entry.title}>
                  {!collapsed && (
                    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500/70">
                      {entry.title}
                    </p>
                  )}
                  {sectionItems.map((item) => {
                    if (isDivider(item)) return <div key={item.id} className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200" />;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={(): void => { handleItemClick(item); }}
                        whileHover={{ scale: collapsed ? 1.04 : 1.01, x: collapsed ? 0 : 2 }}
                        whileTap={{ scale: collapsed ? 0.94 : 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className={cn(
                          "group relative flex w-full items-center gap-3 rounded-xl font-bold transition-colors",
                          collapsed ? "justify-center py-3" : "px-3 py-2.5 text-sm",
                          item.active ? activeClasses : item.danger ? "border border-danger-500/20 bg-danger-500/6 text-neutral-100 hover:bg-danger-500 hover:text-white light:border-danger-500/25 light:text-neutral-900" : hoverClasses,
                        )}
                      >
                        <div className={cn("flex items-center justify-center", collapsed && "w-full")}>
                          <Icon className={cn(
                            "h-[20px] w-[20px] shrink-0",
                            item.danger ? "text-danger-500" : item.active ? "text-primary-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]" : "text-neutral-400 group-hover:text-primary-400/80 light:text-neutral-500 light:group-hover:text-primary-500",
                          )} />
                        </div>
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-start text-[13px] font-semibold tracking-wide">{item.label}</span>
                            {item.badge !== undefined && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-400 px-1.5 text-[10px] font-bold text-white shadow-[0_0_6px_rgba(34,211,238,0.3)]">
                                {item.badge > 99 ? "99+" : String(item.badge)}
                              </span>
                            )}
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              );
            }

            if (isDivider(entry)) {
              return <div key={entry.id} className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
            }

            const Icon = entry.icon;
            return (
              <motion.button
                key={entry.id}
                onClick={(): void => { handleItemClick(entry); }}
                whileHover={{ scale: collapsed ? 1.04 : 1.01, x: collapsed ? 0 : 2 }}
                whileTap={{ scale: collapsed ? 0.94 : 0.97 }}
                transition={SPRING_FAST}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-xl font-bold transition-all duration-150",
                  collapsed ? "justify-center py-3" : "px-3 py-2.5 text-sm",
                  entry.active ? activeClasses : entry.danger ? "border border-danger-500/20 bg-danger-500/6 text-neutral-100 hover:bg-danger-500 hover:text-white light:border-danger-500/25 light:text-neutral-900" : hoverClasses,
                )}
              >
                <div className={cn("flex items-center justify-center", collapsed && "w-full")}>
                  <Icon className={cn(
                    "h-[20px] w-[20px] shrink-0",
                    entry.danger ? "text-danger-500" : entry.active ? "text-primary-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]" : "text-neutral-400 group-hover:text-primary-400/80 light:text-neutral-500 light:group-hover:text-primary-500",
                  )} />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-start text-[13px]">{entry.label}</span>
                    {entry.badge !== undefined && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-400 px-1.5 text-[10px] font-bold text-white">
                        {entry.badge > 99 ? "99+" : String(entry.badge)}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            );
          }) : null}
        </div>

        {children && !collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 border-t border-white/5 pt-3 light:border-neutral-200">
            {children}
          </motion.div>
        )}
      </nav>

      {/* ── Install App ── */}
      {!isStandalone() && (
        <div className={collapsed ? "flex justify-center py-2" : "px-3 py-2"}>
          <InstallButton collapsed={collapsed} />
        </div>
      )}

      {/* ── Social Dock ── */}
      <SocialDock collapsed={collapsed} />
    </motion.aside>
  );
}

export type { SidebarProps, SidebarItem, SidebarSection, SidebarContent };
