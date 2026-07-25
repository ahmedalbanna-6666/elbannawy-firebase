"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { AssessmentPlayer, type AssessmentTypeConfig } from "@/components/assessment-player";
import { ClipboardList } from "lucide-react";

const HOMEWORK_CONFIG: AssessmentTypeConfig = {
  apiPrefix: "homework",
  icon: ClipboardList,
  titleSingular: "الواجب",
  submitLabel: "تسليم الواجب",
  retryLabel: "إعادة المحاولة",
  noDataTitle: "لا يوجد واجب",
  noDataDescription: "لا يوجد واجب مخصص لهذا الدرس",
  lockedTitle: "الواجب مقفل",
  loadingTitle: "فشل تحميل الواجب",
  errorTitle: "فشل تحميل الواجب",
  showXP: false,
  showPrereqCheck: false,
  showNextLessonBadge: false,
};

export default function HomeworkPage(): ReactNode {
  const params = useParams();
  const lessonId = params.lessonId as string;

  return <AssessmentPlayer lessonId={lessonId} type={HOMEWORK_CONFIG} />;
}
