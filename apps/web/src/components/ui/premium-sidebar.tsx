"use client";

import { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── SVG Science Illustrations ─────────────────────────────── */

const BG_ILLUSTRATIONS = (
  <svg className="pointer-events-none fixed inset-0 h-full w-full" style={{ opacity: 0.05 }}>
    {/* DNA Helix */}
    <g transform="translate(20, 40) scale(0.6)">
      <path d="M0,0 C20,-20 60,-20 80,0 C100,20 140,20 160,0" fill="none" stroke="white" strokeWidth="2" />
      <path d="M0,30 C20,10 60,10 80,30 C100,50 140,50 160,30" fill="none" stroke="white" strokeWidth="2" />
      <line x1="20" y1="-8" x2="20" y2="22" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <line x1="60" y1="-8" x2="60" y2="22" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <line x1="100" y1="12" x2="100" y2="42" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <line x1="140" y1="12" x2="140" y2="42" stroke="white" strokeWidth="1.5" opacity="0.6" />
    </g>
    {/* Atom */}
    <g transform="translate(200, 80) scale(0.5)">
      <ellipse cx="0" cy="0" rx="60" ry="20" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(0)" />
      <ellipse cx="0" cy="0" rx="60" ry="20" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(60)" />
      <ellipse cx="0" cy="0" rx="60" ry="20" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(120)" />
      <circle cx="0" cy="0" r="6" fill="white" />
    </g>
    {/* Globe */}
    <g transform="translate(40, 200) scale(0.4)">
      <circle cx="0" cy="0" r="50" fill="none" stroke="white" strokeWidth="2" />
      <ellipse cx="0" cy="0" rx="25" ry="50" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
      <line x1="-50" y1="0" x2="50" y2="0" stroke="white" strokeWidth="1" opacity="0.6" />
      <path d="M-20,-45 Q0,-30 20,-45" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      <path d="M-25,-20 Q0,0 25,-20" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      <path d="M-20,20 Q0,40 20,20" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
    </g>
    {/* Math Symbols */}
    <g transform="translate(240, 200) scale(0.5)">
      <text x="0" y="0" fill="white" fontSize="40" fontFamily="serif">∑</text>
      <text x="60" y="0" fill="white" fontSize="30" fontFamily="serif">π</text>
      <text x="0" y="50" fill="white" fontSize="30" fontFamily="serif">√</text>
      <text x="50" y="50" fill="white" fontSize="25" fontFamily="serif">∞</text>
    </g>
    {/* Molecule */}
    <g transform="translate(100, 340) scale(0.5)">
      <circle cx="0" cy="0" r="8" fill="white" />
      <circle cx="30" cy="-20" r="6" fill="white" opacity="0.8" />
      <circle cx="30" cy="20" r="6" fill="white" opacity="0.8" />
      <circle cx="60" cy="0" r="8" fill="white" />
      <line x1="8" y1="0" x2="24" y2="-16" stroke="white" strokeWidth="1.5" />
      <line x1="8" y1="0" x2="24" y2="16" stroke="white" strokeWidth="1.5" />
      <line x1="36" y1="-14" x2="54" y2="-4" stroke="white" strokeWidth="1.5" />
      <line x1="36" y1="14" x2="54" y2="4" stroke="white" strokeWidth="1.5" />
    </g>
    {/* Physics */}
    <g transform="translate(280, 320) scale(0.4)">
      <rect x="-30" y="-40" width="60" height="80" rx="4" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M-25,-30 L0,-10 L25,-30" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M-25,-5 L0,15 L25,-5" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M-25,20 L0,40 L25,20" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
    </g>
  </svg>
);

/* ── Placeholder Social Icons ───────────────────────────────── */

function SocialIcon({ label }: { label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500 transition-colors hover:bg-neutral-200"
      aria-label={label}
    >
      {label.slice(0, 2)}
    </motion.button>
  );
}

/* ── Placeholder Menu Icon ──────────────────────────────────── */

function MenuIcon({ index }: { index: number }) {
  const shapes = ["◈", "◎", "◇", "□", "△", "○", "☆", "♢"];
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-sm text-white/80">
      {shapes[index % shapes.length]}
    </span>
  );
}

/* ── Props ─────────────────────────────────────────────────── */

interface PremiumSidebarProps {
  children?: ReactNode;
}

/* ── Menu Button ────────────────────────────────────────────── */

const menuBtn = (
  <motion.button
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.94 }}
    transition={{ type: "spring", stiffness: 500, damping: 12 }}
    className="fixed left-4 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl backdrop-blur-xl"
    style={{
      backgroundColor: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.15)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.06) inset",
    }}
    aria-label="Toggle menu"
  >
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <path d="M1 2H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M1 8H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M1 14H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </motion.button>
);

/* ── Menu Items Data ────────────────────────────────────────── */

const MENU_ITEMS = [
  { id: "1", label: "Menu Item 1" },
  { id: "2", label: "Menu Item 2" },
  { id: "3", label: "Menu Item 3" },
  { id: "4", label: "Menu Item 4" },
  { id: "5", label: "Menu Item 5" },
  { id: "6", label: "Menu Item 6" },
];

/* ── SOCIAL_DOCK ICONS ──────────────────────────────────────── */

const SOCIAL_ITEMS = ["Social 1", "Social 2", "Social 3", "Social 4", "Social 5"];

/* ── SIDEBAR_WIDTH ──────────────────────────────────────────── */

const SIDEBAR_WIDTH = "80%";
const CONTENT_TRANSLATE = "72%";
const CONTENT_SCALE = 0.96;
const CONTENT_RADIUS = 28;

/* ── FRAMER MOTION SPRING CONFIG ────────────────────────────── */

const spring = { type: "spring" as const, stiffness: 300, damping: 28, mass: 0.8 };
const easeOut = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

/* ── COMPONENT ──────────────────────────────────────────────── */

export function PremiumSidebar({ children }: PremiumSidebarProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((p) => !p), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-100" dir="ltr">
      {/* ── Main Content ── */}
      <motion.div
        animate={{
          x: open ? CONTENT_TRANSLATE : 0,
          scale: open ? CONTENT_SCALE : 1,
          borderRadius: open ? CONTENT_RADIUS : 0,
        }}
        transition={easeOut}
        style={{ originX: 0 }}
        className="relative z-10 min-h-screen bg-white shadow-2xl will-change-transform"
      >
        {/* Floating Menu Button */}
        <div onClick={toggle}>{menuBtn}</div>

        {/* Demo Content */}
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <h1 className="text-3xl font-bold text-neutral-800">Premium Sidebar</h1>
          <p className="mt-3 text-neutral-500">Tap the menu button</p>
          {children && <div className="mt-6 w-full max-w-md">{children}</div>}
        </div>
      </motion.div>

      {/* ── Overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-20"
            style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={spring}
            className="fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden"
            style={{ width: SIDEBAR_WIDTH, backgroundColor: "#065F57" }}
          >
            {/* Science Illustrations Background */}
            {BG_ILLUSTRATIONS}

            {/* Scrollable Menu Area */}
            <div className="relative z-10 flex flex-1 flex-col px-6 pt-24 pb-6">
              {/* Close button */}
              <motion.button
                onClick={close}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                aria-label="Close menu"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.button>

              {/* Menu Items */}
              <div className="flex flex-col gap-4">
                {MENU_ITEMS.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.12)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center gap-4 px-6 text-left backdrop-blur-sm transition-colors"
                    style={{
                      height: "64px",
                      borderRadius: "18px",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <MenuIcon index={i} />
                    <span className="text-base font-semibold text-white/90">{item.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Social Dock */}
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: MENU_ITEMS.length * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center gap-1"
                style={{
                  height: "68px",
                  borderRadius: "999px",
                  backgroundColor: "white",
                  padding: "0 18px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                {SOCIAL_ITEMS.map((s) => (
                  <SocialIcon key={s} label={s} />
                ))}
              </motion.div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
