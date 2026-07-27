"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/lib/use-permissions";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { BookMarked, Play, Clock, HelpCircle, ArrowLeft } from "lucide-react";

interface SectionItem {
  id: string; title: string; description: string | null;
  questionCount: number; durationMinutes: number;
  displayOrder: number; published: boolean;
}

export default function FinalReviewPage(): ReactNode {
  const router = useRouter();
  usePermissions();

  const { data: reviews, isLoading, isError, error } = useQuery({
    queryKey: ["final-reviews", "student"],
    queryFn: async () => {
      const res = await api.get<{ items?: SectionItem[]; nextCursor?: string | null } | SectionItem[]>("/final-reviews");
      const raw = res.data ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 300_000,
  });

  const firstReviewId = Array.isArray(reviews) && reviews.length > 0 ? (reviews[0] as { id: string }).id : null;

  const { data: sections } = useQuery({
    queryKey: ["final-review-units-student", firstReviewId],
    queryFn: async () => {
      if (!firstReviewId) return [];
      const res = await api.get<SectionItem[] | { items: SectionItem[]; nextCursor?: string | null }>(`/final-reviews/${firstReviewId}/units`);
      const raw = res.data ?? [];
      return Array.isArray(raw) ? raw : raw.items ?? [];
    },
    enabled: !!firstReviewId,
    staleTime: 300_000,
  });

  const allSections = sections ?? [];

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (isError) return <ErrorState title="فشل تحميل المراجعة" description={error instanceof Error ? error.message : "حدث خطأ"} />;
  if (allSections.length === 0) return <EmptyState title="المراجعة النهائية غير متاحة" description="ستصبح المراجعة النهائية متاحة خلال فترة المراجعة الرسمية" icon={<BookMarked className="h-16 w-16" />} />;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={(): void => { router.push("/dashboard"); }} className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 w-fit"><ArrowLeft className="h-4 w-4" />العودة للرئيسية</button>
      <div><h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">المراجعة النهائية</h1><p className="mt-1 text-sm text-neutral-500">استعد للاختبارات بمراجعة شاملة</p></div>
      <div className="flex flex-col gap-3">
        {allSections.map((s) => (
          <Card key={s.id} variant="outline" padding="md" className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-primary-500/60">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                  <BookMarked className="h-6 w-6 text-primary-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{s.title}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" />{s.questionCount ?? 0} سؤال</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.durationMinutes ?? 0} دقيقة</span>
                  </div>
                </div>
                <Button size="sm" variant="primary" className="shrink-0" onClick={(): void => { router.push(`/dashboard/final-review/${s.id}`); }}>
                  <Play className="h-4 w-4" />ابدأ المراجعة
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
