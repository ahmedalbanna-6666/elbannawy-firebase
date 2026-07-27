"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Breadcrumb } from "@/components/units/breadcrumb";
import { EntityContentBlocks, type ContentConfig } from "@/components/content/content-blocks";
import { TeacherContextBanner } from "@/components/ui/teacher-context-banner";


export default function SectionContentPage(): ReactNode {
  const params = useParams();
  const user = useAuthStore((s) => s.user);
  const rawRole = user?.role;
  const reviewId = params.reviewId as string;
  const sectionId = params.sectionId as string;
  const hydrated = typeof rawRole === "string";

  const { data: review, error: reviewErr, isLoading } = useQuery({
    queryKey: ["management-final-review", reviewId],
    queryFn: async () => {
      const res = await api.get<{ id: string; title: string }>(`/final-reviews/${reviewId}`);
      return res.data ?? null;
    },
    enabled: hydrated,
  });

  if (!hydrated) return null;

  if (isLoading) return <SectionSkeleton />;

  if (reviewErr) return <ErrorState title="خطأ في تحميل المراجعة" description={reviewErr instanceof Error ? reviewErr.message : "خطأ غير معروف"} />;

  if (!review) {
    return (
      <ErrorState
        title="فشل تحميل المراجعة"
        description="المراجعة غير موجودة"
      />
    );
  }

  const config: ContentConfig = {
    entityType: "SECTION",
    entityId: sectionId,
    labels: {
      entityName: "المراجعة",
      video: "فيديو المراجعة",
      vocabulary: "مفردات المراجعة",
      pdf: "ملف PDF",
      quiz: "اختبار المراجعة",
      homework: "واجب المراجعة",
    },
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TeacherContextBanner />
      <Breadcrumb
        items={[
          { label: "المراجعات", href: "/dashboard/final-reviews" },
          { label: review.title, href: `/dashboard/final-reviews/${reviewId}` },
          { label: "المحتوى" },
        ]}
      />
      <div>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {review.title} — محتوى القسم
        </h1>
      </div>
      <EntityContentBlocks config={config} />
    </div>
  );
}

function SectionSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-64" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
