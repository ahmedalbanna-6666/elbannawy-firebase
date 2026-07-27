"use client";

import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Select } from "@/components/ui/select";
import { useAcademicContextStore } from "@/lib/academic-context-store";
import { useAuthStore } from "@/lib/auth-store";
import {
  STAGE_OPTIONS,
  SYSTEM_OPTIONS,
  getGradeOptions,
  stageLabelToKey,
} from "@/lib/education-options";
import { cn } from "@/lib/utils";

interface AcademicContextBarProps {
  className?: string;
}

interface MyGradesResponse {
  gradeIds: string[];
  grades: { id: string; name: string; stage: { id: string; name: string } }[];
}

export function AcademicContextBar({ className }: AcademicContextBarProps): ReactNode {
  const educationalSystem = useAcademicContextStore((s) => s.educationalSystem);
  const stage = useAcademicContextStore((s) => s.stage);
  const gradeIdVal = useAcademicContextStore((s) => s.gradeId);
  const setEducationalSystem = useAcademicContextStore((s) => s.setEducationalSystem);
  const setStage = useAcademicContextStore((s) => s.setStage);
  const setGrade = useAcademicContextStore((s) => s.setGrade);
  const applyPlatformContext = useAcademicContextStore((s) => s.applyPlatformContext);

  const userRole = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);
  const isAdmin = userRole === "ADMINISTRATOR";
  const isTeacher = userRole === "TEACHER" || userRole === "STAFF";

  const { data: myGrades } = useQuery({
    queryKey: ["my-grades", userId],
    queryFn: async () => {
      const res = await api.get<MyGradesResponse>("/teachers/my-grades");
      return res.data ?? null;
    },
    enabled: isTeacher && !!userId,
    staleTime: 30_000,
  });

  const { data: activeCtx } = useQuery({
    queryKey: ["platform-active-context"],
    queryFn: async () => {
      const res = await api.get<{ academicYear: { id: string; name: string } | null; term: { id: string; name: string } | null; termManagementMode: string }>("/academic-context");
      return res.data ?? null;
    },
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (activeCtx?.academicYear) {
      applyPlatformContext({
        academicYearId: activeCtx.academicYear.id,
        academicYearName: activeCtx.academicYear.name,
        termId: activeCtx.term?.id ?? null,
        termName: activeCtx.term?.name ?? null,
      });
    }
  }, [activeCtx, applyPlatformContext]);

  useQuery({
    queryKey: ["curriculum-stages"],
    queryFn: async () => {
      const res = await api.get<{ id: string; name: string; grades: { id: string; name: string }[] }[]>("/curriculum/stages");
      return res.data ?? [];
    },
    enabled: isAdmin,
    staleTime: Infinity,
  });

  const assignedGradeIds = new Set(myGrades?.grades.map((g) => g.id) ?? []);

  const gradeOptions = stage ? getGradeOptions(stage) : [];
  const filteredGradeOptions = isTeacher && myGrades
    ? gradeOptions.filter((g) => assignedGradeIds.has(g.value))
    : gradeOptions;

  const stageGradeNames = new Map<string, Set<string>>();
  if (isTeacher && myGrades && Array.isArray(myGrades.grades)) {
    for (const g of myGrades.grades) {
      if (!g || typeof g !== "object" || !g.stage) continue;
      const stageKey = stageLabelToKey(g.stage.name) ?? g.stage.name;
      if (!stageGradeNames.has(stageKey)) {
        stageGradeNames.set(stageKey, new Set());
      }
      stageGradeNames.get(stageKey)?.add(g.name);
    }
  }

  const filteredStageOptions = isTeacher && myGrades
    ? STAGE_OPTIONS.filter((s) => stageGradeNames.has(s.value))
    : STAGE_OPTIONS;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      role="group"
      aria-label="السياق الأكاديمي"
    >
      <Select
        size="sm"
        options={SYSTEM_OPTIONS}
        placeholder="نظام التعليم"
        value={educationalSystem ?? ""}
        onChange={(e): void => { setEducationalSystem(e.target.value); }}
        aria-label="نظام التعليم"
      />
      <Select
        size="sm"
        options={filteredStageOptions}
        placeholder="المرحلة"
        value={stage ?? ""}
        onChange={(e): void => { setStage(e.target.value); }}
        aria-label="المرحلة"
      />
      <Select
        size="sm"
        options={filteredGradeOptions}
        placeholder="الصف"
        value={gradeIdVal ?? ""}
        onChange={(e): void => {
          const selectedId = e.target.value;
          const option = filteredGradeOptions.find((o) => o.value === selectedId);
          setGrade(option?.label ?? selectedId, selectedId);
        }}
        disabled={!stage}
        aria-label="الصف"
      />
    </div>
  );
}

export type { AcademicContextBarProps };
