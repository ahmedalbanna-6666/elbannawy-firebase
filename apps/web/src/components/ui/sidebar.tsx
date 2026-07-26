"use client";

import { useState, useCallback, type ReactNode, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Facebook,
  MessageCircle,
  Send,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_LABELS } from "@el-bannawy/shared";

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
  { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-400 group-hover:text-blue-400" },
  { icon: MessageCircle, href: "#", label: "WhatsApp", color: "hover:text-green-400 group-hover:text-green-400" },
  { icon: Send, href: "#", label: "Telegram", color: "hover:text-sky-400 group-hover:text-sky-400" },
  { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-400 group-hover:text-red-400" },
];

const SPRING_FAST = { type: "spring" as const, stiffness: 400, damping: 25 };
const SPRING_SIDEBAR = { type: "spring" as const, stiffness: 280, damping: 30, mass: 1 };
const SPRING_CONTENT = { type: "spring" as const, stiffness: 300, damping: 28, mass: 0.9 };
const STAGGER = { staggerChildren: 0.03, delayChildren: 0.05 };

/* ── Sub-Components ───────────────────────────────────────── */

function SocialDock({ collapsed }: { collapsed?: boolean }): ReactNode {
  if (collapsed) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35 }}
      className="relative z-10 shrink-0 border-t border-white/5 px-4 py-4 light:border-neutral-200"
    >
      <div className="flex items-center justify-center gap-3">
        {SOCIAL_LINKS.map((social) => (
          <motion.a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING_FAST}
            className={cn(
              "group flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors",
              "hover:bg-white/10 light:hover:bg-neutral-100",
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

function SidebarProfile({ collapsed, onProfileClick, gradeLabel }: { collapsed?: boolean; onProfileClick?: () => void; gradeLabel: string }): ReactNode {
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
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-400 shadow-[0_0_14px_rgba(34,211,238,0.2)] ring-2 ring-primary-400/20">
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="relative z-10 flex shrink-0 flex-col items-center pb-4 pt-6"
    >
      <motion.button
        onClick={onProfileClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={SPRING_FAST}
        className="group relative cursor-pointer"
      >
        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary-400 shadow-[0_0_24px_rgba(34,211,238,0.2)] ring-2 ring-primary-400/10 transition-all duration-300 group-hover:shadow-[0_0_36px_rgba(34,211,238,0.35)] group-hover:ring-primary-400/30">
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 12 }}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
        >
          <User className="h-3 w-3 text-white" />
        </motion.div>
      </motion.button>

      <span className="mt-2.5 text-xs font-semibold text-neutral-400">
        {gradeLabel}
      </span>

      <motion.button
        onClick={onProfileClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-1.5 flex items-center gap-1 text-xs font-bold text-primary-400 transition-colors hover:text-primary-300"
      >
        <User className="h-3 w-3" />
        <span>الملف الشخصي</span>
      </motion.button>
    </motion.div>
  );
}

function NavList({ items, collapsed, onItemClick }: { items: SidebarItem[]; collapsed?: boolean; onItemClick: (item: SidebarItem) => void }): ReactNode {
  return (
    <>
      {items.map((item, i) => {
        if (isDivider(item)) {
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="mx-2 my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200"
            />
          );
        }

        const Icon = item.icon;

        return (
          <motion.button
            key={item.id}
            onClick={(): void => { onItemClick(item); }}
            whileHover={{ scale: collapsed ? 1.04 : 1.02 }}
            whileTap={{ scale: collapsed ? 0.94 : 0.97 }}
            transition={SPRING_FAST}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl font-bold transition-colors",
              collapsed
                ? "justify-center px-0 py-3"
                : "px-4 py-2.5 text-sm",
              item.active
                ? "bg-primary-400/12 text-primary-400"
                : item.danger
                  ? "border border-danger-500/18 bg-danger-500/5 text-neutral-100 hover:bg-danger-500 hover:text-white light:border-danger-500/25 light:text-neutral-900"
                  : "text-neutral-100 hover:bg-white/8 hover:text-primary-400 light:text-neutral-900 light:hover:bg-neutral-100 light:hover:text-primary-600",
            )}
          >
            {/* Active indicator */}
            {item.active && !collapsed && (
              <motion.span
                layoutId="activeIndicator"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary-400"
              />
            )}

            <div className={cn(
              "flex items-center justify-center",
              collapsed && "w-full",
            )}>
              <Icon className={cn(
                "h-5 w-5 shrink-0",
                item.danger ? "text-danger-500" : item.active ? "text-primary-400" : "text-neutral-400",
              )} />
            </div>

            {!collapsed && (
              <>
                <span className="flex-1 text-start text-sm">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-400 px-1.5 text-[10px] font-bold text-white">
                    {item.badge > 99 ? "99+" : String(item.badge)}
                  </span>
                )}
              </>
            )}
          </motion.button>
        );
      })}
    </>
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

  const sidebarWidth = collapsed ? "w-[68px] min-w-[68px]" : "w-[260px] min-w-[260px]";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
      className={cn(
        "flex h-screen flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-950/95 backdrop-blur-2xl",
        "dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950/95",
        "light:border-neutral-200 light:from-white light:via-white light:to-white/95",
        "lg:static lg:relative",
        collapsed ? "px-2" : "px-4",
        className,
      )}
    >
      {/* Close/Collapse button */}
      <div className={cn(
        "flex shrink-0 items-center",
        collapsed ? "justify-center py-4" : "justify-between pt-4 pb-2",
      )}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500"
          >
            القائمة
          </motion.span>
        )}
        <motion.button
          onClick={collapsed ? (): void => { setCollapsed(false); } : (): void => { setCollapsed(true); }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING_FAST}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white/10 hover:text-white light:hover:bg-neutral-100 light:hover:text-neutral-700"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* Profile */}
      <SidebarProfile collapsed={collapsed} onProfileClick={onProfileClick} gradeLabel={gradeLabel} />

      {/* Divider */}
      <div className="mb-2 mt-0 h-px shrink-0 bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200" />

      {/* Navigation */}
      <nav className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain py-1",
        "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]",
        "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/8",
        "hover:[&::-webkit-scrollbar-thumb]:bg-white/20",
        "light:[&::-webkit-scrollbar-thumb]:bg-neutral-300/40",
        "light:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400",
      )}>
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: STAGGER } }}
          className="flex flex-col gap-1"
        >
          {Array.isArray(items) ? items.map((entry) => {
            if (!entry || typeof entry !== "object") return null;

            if (isSection(entry)) {
              const sectionItems = Array.isArray(entry.items) ? entry.items : [];
              return (
                <div key={entry.title}>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500"
                    >
                      {entry.title}
                    </motion.p>
                  )}
                  <NavList items={sectionItems} collapsed={collapsed} onItemClick={handleItemClick} />
                </div>
              );
            }

            return (
              <div key={entry.id}>
                {isDivider(entry) ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mx-2 my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200"
                  />
                ) : (
                  <motion.button
                    onClick={(): void => { handleItemClick(entry); }}
                    whileHover={{ scale: collapsed ? 1.04 : 1.02 }}
                    whileTap={{ scale: collapsed ? 0.94 : 0.97 }}
                    transition={SPRING_FAST}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl font-bold transition-colors",
                      collapsed ? "justify-center px-0 py-3" : "px-4 py-2.5 text-sm",
                      entry.active
                        ? "bg-primary-400/12 text-primary-400"
                        : entry.danger
                          ? "border border-danger-500/18 bg-danger-500/5 text-neutral-100 hover:bg-danger-500 hover:text-white light:border-danger-500/25 light:text-neutral-900"
                          : "text-neutral-100 hover:bg-white/8 hover:text-primary-400 light:text-neutral-900 light:hover:bg-neutral-100 light:hover:text-primary-600",
                    )}
                  >
                    {entry.active && !collapsed && (
                      <motion.span
                        layoutId="activeIndicator"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary-400"
                      />
                    )}
                    <div className={cn("flex items-center justify-center", collapsed && "w-full")}>
                      <entry.icon className={cn(
                        "h-5 w-5 shrink-0",
                        entry.danger ? "text-danger-500" : entry.active ? "text-primary-400" : "text-neutral-400",
                      )} />
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-start text-sm">{entry.label}</span>
                        {entry.badge !== undefined && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-400 px-1.5 text-[10px] font-bold text-white">
                            {entry.badge > 99 ? "99+" : String(entry.badge)}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            );
          }) : null}
        </motion.div>

        {children && !collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 border-t border-white/5 pt-3 light:border-neutral-200"
          >
            {children}
          </motion.div>
        )}
      </nav>

      {/* Social Dock */}
      <SocialDock collapsed={collapsed} />
    </motion.aside>
  );
}

export type { SidebarProps, SidebarItem, SidebarSection, SidebarContent };
