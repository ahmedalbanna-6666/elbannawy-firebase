"use client";

import { useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ActivityRenderer } from "@/components/activities/activity-renderer";
import type { ActivityType } from "@/components/activities/activity-renderer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, BookOpen, CheckCircle, Loader2 } from "lucide-react";

interface ActivityItem {
  id: string;
  lessonId: string;
  type: string;
  title: string;
  config: string;
  displayOrder: number;
  status: string;
}

const TYPE_MAP: Record<string, ActivityType> = {
  MCQ: "MULTIPLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_IN_BLANK: "FILL_IN_BLANK",
  FILL_IN_BLANKS: "FILL_IN_BLANKS",
  MATCHING: "MATCHING",
  DRAG_DROP: "DRAG_DROP",
  VOCABULARY: "VOCABULARY",
  READING: "READING",
  REWRITE: "WRITING",
  CORRECT: "WRITING",
  DIALOGUE: "WRITING",
  WRITING: "WRITING",
};

function mapType(raw: string): ActivityType {
  return TYPE_MAP[raw] ?? "MULTIPLE_CHOICE";
}

export default function StudentActivitiesPage(): ReactNode {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const lessonId = params.lessonId as string;
  const [completedCount, setCompletedCount] = useState(0);

  const { data: activityList, isLoading } = useQuery({
    queryKey: ["lesson-activities", lessonId],
    queryFn: async () => {
      const res = await api.get<{ items: ActivityItem[]; nextCursor: string | null }>("/activities?lessonId=" + encodeURIComponent(lessonId));
      return res.data?.items ?? [];
    },
  });

  const totalActivities = activityList?.length ?? 0;

  const submitMutation = useMutation({
    mutationFn: async ({ activityId, answers }: { activityId: string; answers: string[] }) => {
      const startRes = await api.post<{ id: string }>("/activities/" + activityId + "/execute", { lessonId, unitId: "" });
      if (!startRes.data) throw new Error("Failed to start attempt");
      const submitRes = await api.post<Record<string, unknown>>("/activities/" + activityId + "/submit", {
        attemptId: startRes.data.id,
        answer: answers,
        timeSpent: 30,
      });
      return submitRes.data;
    },
    onSuccess: (_data, vars) => {
      setCompletedCount(c => c + 1);
      void queryClient.invalidateQueries({ queryKey: ["lesson-activities", lessonId] });
    },
  });

  const handleSubmit = async (activityId: string, answers: string[]): Promise<void> => {
    await submitMutation.mutateAsync({ activityId, answers });
  };

  const allDone = completedCount >= totalActivities && totalActivities > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!activityList || activityList.length === 0) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={(): void => { router.back(); }}><ArrowLeft className="h-4 w-4 ml-2" /> Back</Button>
        <EmptyState icon={<BookOpen className="h-12 w-12" />} title="No Activities" description="This lesson has no activities yet." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={(): void => { router.back(); }}><ArrowLeft className="h-4 w-4 ml-2" /> Back</Button>
          <h1 className="mt-2 text-2xl font-bold">Lesson Activities</h1>
          <p className="text-sm text-neutral-500">{completedCount} of {totalActivities} completed</p>
        </div>
        {allDone && (
          <Button onClick={(): void => { router.push("/dashboard/lessons/detail/" + lessonId + "/results"); }}>
            <CheckCircle className="h-4 w-4 ml-2" /> View Results
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {activityList.map((activity) => (
          <ActivityRenderer
            key={activity.id}
            id={activity.id}
            type={mapType(activity.type)}
            title={activity.title}
            config={activity.config}
            displayOrder={activity.displayOrder}
            onSubmit={(id, answers): Promise<void> => handleSubmit(id, answers)}
          />
        ))}
      </div>

      {allDone && (
        <div className="mt-8 text-center">
          <Button size="lg" onClick={(): void => { router.push("/dashboard/lessons/detail/" + lessonId + "/results"); }}>
            <CheckCircle className="h-5 w-5 ml-2" /> View Your Results
          </Button>
        </div>
      )}
    </div>
  );
}
