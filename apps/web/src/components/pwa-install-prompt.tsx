"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share2, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/lib/use-pwa-install";

export function PwaInstallPrompt(): ReactNode {
  const { canInstall, isIos, install, dismiss, dismissed, isStandalone } = usePwaInstall();

  if (dismissed || isStandalone || !canInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96">
      <div className="flex items-start gap-3 rounded-2xl border border-primary-500/20 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-lg dark:bg-neutral-900/95">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
          {isIos ? <Share2 className="h-5 w-5 text-primary-500" /> : <Download className="h-5 w-5 text-primary-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-100">ثبّت منصة البناوي</p>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">
            {isIos
              ? "اضغط مشاركة ← أضف إلى الشاشة الرئيسية لسهولة الوصول"
              : "حمّل المنصة كتطبيق على جهازك واستمتع بتجربة أسرع وإشعارات فورية"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="xs" className="shrink-0 gap-1.5" onClick={install}>
              <Smartphone className="h-3.5 w-3.5" />
              {isIos ? "طريقة التثبيت" : "تثبيت التطبيق"}
            </Button>
            <button
              onClick={dismiss}
              className="flex shrink-0 items-center justify-center rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            >
              لاحقاً
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="flex shrink-0 items-center justify-center rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          aria-label="تجاهل"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
