"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, GraduationCap, BookOpen, ChevronLeft, Check } from "lucide-react";

interface StageOption {
  id: string;
  name: string;
  grades: { id: string; name: string }[];
}

interface TermOption {
  id: string;
  name: string;
}

export default function OnboardingPage(): ReactNode {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [stages, setStages] = useState<StageOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [stageId, setStageId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [termId, setTermId] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/v1/academic-context/options")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setStages(res.data.stages ?? []);
          setTerms(res.data.terms ?? []);
          if (res.data.terms.length === 1) setTermId(res.data.terms[0].id);
        }
      })
      .catch(() => {});
  }, [user]);

  const selectedStage = stages.find((s) => s.id === stageId);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!gradeId) { setError("يرجى اختيار الصف الدراسي"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, gradeId, termId: termId || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "فشل الحفظ");
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }, [gradeId, stageId, termId, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">جاري التحميل...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10">
          <Check className="h-8 w-8 text-success-500" />
        </div>
        <h1 className="text-xl font-bold">تم إعداد حسابك بنجاح!</h1>
        <p className="text-neutral-500">جاري تحويلك إلى لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500">
              <School className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">أهلاً بك!</h1>
              <p className="mt-1 text-sm text-neutral-500">اختر مرحلتك الدراسية للبدء</p>
            </div>
            <Badge variant="primary" className="text-[10px]">إعداد الحساب</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-5">
            {terms.length > 1 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">الفصل الدراسي</label>
                <div className="flex flex-wrap gap-2">
                  {terms.map((t) => (
                    <button
                      key={t.id} type="button"
                      onClick={() => setTermId(t.id)}
                      className={`rounded-lg border-2 px-4 py-2 text-sm transition-all ${
                        termId === t.id
                          ? "border-primary-500 bg-primary-500/10 text-primary-600"
                          : "border-neutral-200 hover:border-primary-500/50"
                      }`}
                    >{t.name}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">المرحلة التعليمية</label>
              <div className="flex flex-col gap-2">
                {stages.map((s) => (
                  <button
                    key={s.id} type="button"
                    onClick={() => { setStageId(s.id); setGradeId(""); }}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                      stageId === s.id
                        ? "border-primary-500 bg-primary-500/10 text-primary-600"
                        : "border-neutral-200 text-neutral-700 hover:border-primary-500/50"
                    }`}
                  >
                    <GraduationCap className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-bold">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedStage && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">الصف الدراسي</label>
                <div className="flex flex-col gap-2">
                  {selectedStage.grades.map((g) => (
                    <button
                      key={g.id} type="button"
                      onClick={() => setGradeId(g.id)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        gradeId === g.id
                          ? "border-primary-500 bg-primary-500/10 text-primary-600"
                          : "border-neutral-200 text-neutral-700 hover:border-primary-500/50"
                      }`}
                    >
                      <BookOpen className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-bold">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-500">{error}</p>
            )}

            <Button
              variant="primary" size="md" fullWidth
              onClick={handleSubmit}
              loading={saving}
              disabled={!gradeId}
            >
              <ChevronLeft className="h-5 w-5" />
              البدء الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
