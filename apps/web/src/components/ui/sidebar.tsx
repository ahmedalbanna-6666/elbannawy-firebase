"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { ChevronLeft, User, Facebook, MessageCircle, Send, Youtube, type LucideIcon } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_LABELS } from "@el-bannawy/shared";

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

function isSection(item: SidebarItem | SidebarSection): item is SidebarSection {
  return "items" in item && Array.isArray(item.items);
}

function isDivider(item: SidebarItem): boolean {
  return item.divider === true;
}

const SOCIAL_LINKS = [
  { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-500" },
  { icon: MessageCircle, href: "#", label: "WhatsApp", color: "hover:text-green-500" },
  { icon: Send, href: "#", label: "Telegram", color: "hover:text-sky-400" },
  { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-500" },
];

export function Sidebar({ items, className, onClose, onToggle, onProfileClick, profileGrade, children }: SidebarProps): ReactNode {
  const { user } = useAuthStore();

  const fullName = user?.fullName ?? "";
  const firstName = fullName ? fullName.split(" ")[0] : "";
  const fallbackRole = (user?.role ?? "").toUpperCase();
  const gradeLabel = profileGrade ?? (user?.role ? ROLE_LABELS[fallbackRole] ?? fallbackRole : "Student");
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || "User")}&background=22D3EE&color=fff&bold=true&font-size=0.33`;

  const handleItemClick = (item: SidebarItem): void => {
    if (item.divider) return;
    item.onClick?.();
    onClose?.();
  };

  const navItemClass = (item: SidebarItem): string =>
    cn(
      "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200",
      item.active
        ? "bg-primary-400/10 text-primary-400"
        : item.danger
          ? "border border-danger-500/20 bg-danger-500/6 text-neutral-100 hover:bg-danger-500 hover:text-white hover:shadow-[0_5px_15px_rgba(239,68,68,0.3)] light:border-danger-500/25 light:bg-danger-500/4 light:text-neutral-900"
          : "text-neutral-100 hover:bg-neutral-800/80 hover:text-primary-400 hover:backdrop-blur-sm hover:border hover:border-white/10 light:text-neutral-900 light:hover:bg-neutral-100 light:hover:text-primary-600 light:hover:border-neutral-200",
    );

  const iconClass = (item: SidebarItem): string =>
    cn(
      "h-5 w-5 shrink-0",
      item.danger ? "text-danger-500" : item.active ? "text-primary-400" : "text-neutral-400 light:text-neutral-500",
    );

  return (
    <aside
      className={cn(
        "flex h-screen flex-col overflow-hidden border-l border-white/10 bg-neutral-950/90 backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-neutral-950/90 light:border-neutral-200 light:bg-white/95",
        "w-[260px] min-w-[260px] px-4",
        className,
      )}
    >
      {/* Close toggle */}
      <div className="flex shrink-0 items-center justify-end pt-4 pb-2">
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white/10 hover:text-white light:hover:bg-neutral-100 light:hover:text-neutral-700"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Profile section - avatar only */}
      <div className="flex shrink-0 flex-col items-center pb-4">
        <div
          onClick={onProfileClick}
          onKeyDown={(e): void => { if (e.key === "Enter" || e.key === " ") { onProfileClick?.(); } }}
          role="button"
          tabIndex={0}
          className="group relative cursor-pointer"
        >
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary-400 shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
            <User className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Grade below avatar */}
        <span className="mt-2.5 text-xs font-semibold text-neutral-400 light:text-neutral-500">
          {gradeLabel}
        </span>

        {/* Profile link */}
        <button
          onClick={onProfileClick}
          className="mt-1.5 flex items-center gap-1 text-xs font-bold text-primary-400 transition-colors hover:text-primary-300"
        >
          <User className="h-3 w-3" />
          <span>الملف الشخصي</span>
        </button>
      </div>

      {/* Divider */}
      <div className="mb-2 h-px shrink-0 bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200" />

      {/* Navigation */}
      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain py-1",
          "[scrollbar-width:thin]",
          "[scrollbar-color:rgba(255,255,255,0.1)_transparent]",
          "[&::-webkit-scrollbar]:w-1",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-white/10",
          "hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
          "light:[&::-webkit-scrollbar-thumb]:bg-neutral-300/50",
          "light:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400",
        )}
      >
        {Array.isArray(items) ? items.map((entry, _idx) => {
          if (!entry || typeof entry !== "object") return null;
          if (isSection(entry)) {
            const sectionItems = Array.isArray(entry.items) ? entry.items : [];
            return (
              <div key={entry.title}>
                <ul className="flex flex-col gap-0.5">
                  {sectionItems.map((item) => (
                    <li key={item.id}>
                      {isDivider(item) ? (
                        <div className="mx-2 my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200" />
                      ) : (
                        <button
                          onClick={(): void => { handleItemClick(item); }}
                          className={navItemClass(item)}
                        >
                          <item.icon className={iconClass(item)} />
                          <span className="flex-1 text-start">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-400 px-1.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          if (isDivider(entry)) {
            return (
              <div key={entry.id} className="mx-2 my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-neutral-200" />
            );
          }

          return (
            <button
              key={entry.id}
              onClick={(): void => { handleItemClick(entry); }}
              className={navItemClass(entry)}
            >
              <entry.icon className={iconClass(entry)} />
              <span className="flex-1 text-start">{entry.label}</span>
              {entry.badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-400 px-1.5 text-[10px] font-bold text-white">
                  {entry.badge}
                </span>
              )}
            </button>
          );
        }) : null}

        {children && (
          <div className="mt-3 border-t border-white/5 pt-3 light:border-neutral-200">
            {children}
          </div>
        )}
      </nav>

      {/* Social Media Links */}
      <div className="shrink-0 border-t border-white/5 py-3 light:border-neutral-200">
        <div className="flex items-center justify-center gap-4">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-all duration-300",
                "hover:scale-110 hover:bg-white/10",
                "light:hover:bg-neutral-100",
                social.color,
              )}
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

export type { SidebarProps, SidebarItem, SidebarSection, SidebarContent };
