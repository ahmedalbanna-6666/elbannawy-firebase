"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { AssessmentPlayer, type AssessmentTypeConfig } from "@/components/assessment-player";
import { GraduationCap } from "lucide-react";

const QUIZ_CONFIG: AssessmentTypeConfig = {
  apiPrefix: "quizzes",
  icon: GraduationCap,
  titleSingular: "الاختبار",
  submitLabel: "تسليم الاختبار",
  retryLabel: "إعادة المحاولة",
  noDataTitle: "لا يوجد اختبار",
  noDataDescription: "لا يوجد اختبار مخصص لهذا الدرس",
  lockedTitle: "الاختبار مقفل",
  loadingTitle: "فشل تحميل الاختبار",
  errorTitle: "فشل تحميل الاختبار",
  showXP: true,
  showPrereqCheck: true,
  showNextLessonBadge: true,
};

export default function QuizPage(): ReactNode {
  const params = useParams();
  const lessonId = params.lessonId as string;

  return <AssessmentPlayer lessonId={lessonId} type={QUIZ_CONFIG} />;
}
