"use client";

import { type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, CheckCircle } from "lucide-react";

export default function StudentResultsPage(): ReactNode {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const completeMutation = useMutation({
    mutationFn: async () => {
      await api.post("/lessons/" + lessonId + "/complete", { completed: true });
    },
    onSuccess: () => {
      router.push("/dashboard/lessons/" + lessonId.split("-")[0]);
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={(): void => { router.back(); }}><ArrowLeft className="h-4 w-4 ms-2" /> Back</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success-500" />
          <h1 className="text-3xl font-bold mb-2">Activities Completed!</h1>
          <p className="text-lg text-neutral-500 mb-8">You have completed all activities for this lesson.</p>

          <Button size="lg" onClick={(): void => { completeMutation.mutate(); }} loading={completeMutation.isPending}>
            <Trophy className="h-5 w-5 ms-2" /> Mark Lesson as Complete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
