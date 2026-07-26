"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import { useAuthStore } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumb } from "@/components/units/breadcrumb";
import { EntityContentBlocks, type ContentConfig } from "@/components/content/content-blocks";
import { TeacherContextBanner } from "@/components/ui/teacher-context-banner";
import { BookOpen } from "lucide-react";

interface ChapterDetail {
  id: string;
  title: string;
  displayOrder: number;
  published: boolean;
}

interface StoryData {
  id: string;
  title: string;
  chapters: ChapterDetail[];
}

export default function ChapterContentPage(): ReactNode {
  const params = useParams();
  const user = useAuthStore((s) => s.user);
  const rawRole = user?.role;
  const { isAdmin, isTeacher } = usePermissions();
  const isManagement = isAdmin || isTeacher;
  const storyId = params.storyId as string;
  const chapterId = params.chapterId as string;
  const hydrated = typeof rawRole === "string";

  const { data: story, isLoading } = useQuery({
    queryKey: ["management-story", storyId],
    queryFn: async () => {
      const res = await api.get<StoryData>(`/stories/${storyId}`);
      return res.data ?? null;
    },
    enabled: hydrated && isManagement,
  });

  const chapter = story?.chapters?.find((c) => c.id === chapterId) ?? null;

  if (!hydrated || !isManagement) return null;
  if (isLoading) return <ChapterSkeleton />;

  if (!story || !chapter) {
    return (
      <EmptyState
        title="الفصل غير موجود"
        description="الفصل الذي تبحث عنه غير متوفر"
        icon={<BookOpen className="h-16 w-16" />}
      />
    );
  }

  const config: ContentConfig = {
    entityType: "CHAPTER",
    entityId: chapterId,
    labels: {
      entityName: "الفصل",
      video: "فيديو الفصل",
      vocabulary: "مفردات الفصل",
      pdf: "ملف PDF",
      quiz: "اختبار الفصل",
      homework: "واجب الفصل",
    },
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TeacherContextBanner />
      <Breadcrumb
        items={[
          { label: "القصص", href: "/dashboard/stories" },
          { label: story.title, href: `/dashboard/stories/${storyId}` },
          { label: chapter.title },
        ]}
      />
      <div>
        <p className="text-xs font-semibold text-primary-500">
          Chapter {String(chapter.displayOrder)}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {chapter.title}
        </h1>
      </div>
      <EntityContentBlocks config={config} />
    </div>
  );
}

function ChapterSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-48" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
