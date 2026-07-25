"use client";

import { useEffect, useMemo, type ReactNode } from "react";
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
  const academicYear = useAcademicContextStore((s) => s.academicYear);
  const academicYearId = useAcademicContextStore((s) => s.academicYearId);
  const educationalSystem = useAcademicContextStore((s) => s.educationalSystem);
  const stage = useAcademicContextStore((s) => s.stage);
  const grade = useAcademicContextStore((s) => s.grade);
  const gradeIdVal = useAcademicContextStore((s) => s.gradeId);
  const term = useAcademicContextStore((s) => s.term);
  const termId = useAcademicContextStore((s) => s.termId);
  const setAcademicYear = useAcademicContextStore((s) => s.setAcademicYear);
  const setAcademicYearId = useAcademicContextStore((s) => s.setAcademicYearId);
  const setEducationalSystem = useAcademicContextStore((s) => s.setEducationalSystem);
  const setStage = useAcademicContextStore((s) => s.setStage);
  const setGrade = useAcademicContextStore((s) => s.setGrade);
  const setTerm = useAcademicContextStore((s) => s.setTerm);
  const setTermId = useAcademicContextStore((s) => s.setTermId);
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
    staleTime: 120_000,
  });

  useEffect(() => {
    if (activeCtx?.academicYear && activeCtx.term) {
      applyPlatformContext({
        academicYearId: activeCtx.academicYear.id,
        academicYearName: activeCtx.academicYear.name,
        termId: activeCtx.term.id,
        termName: activeCtx.term.name,
      });
    }
  }, [activeCtx, applyPlatformContext]);

  const { data: academicYears } = useQuery({
    queryKey: ["admin-academic-years"],
    queryFn: async () => {
      const res = await api.get<{ id: string; name: string; terms: { id: string; name: string }[] }[]>("/admin/academic-years");
      return res.data ?? [];
    },
    staleTime: 60_000,
  });

  const yearOptions = useMemo(() => {
    if (!Array.isArray(academicYears)) return [];
    return academicYears.map((y) => ({ value: y.name, label: y.name }));
  }, [academicYears]);

  const yearToId = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(academicYears)) {
      for (const y of academicYears) {
        if (y && typeof y === "object" && y.name) {
          map.set(y.name, y.id);
        }
      }
    }
    return map;
  }, [academicYears]);

  const termOptions = useMemo(() => {
    if (!Array.isArray(academicYears) || !academicYear) return [];
    const yearId = yearToId.get(academicYear);
    const year = academicYears.find((y) => y.id === yearId || y.name === academicYear);
    if (year && Array.isArray(year.terms) && year.terms.length > 0) {
      return year.terms.map((t) => ({ value: t.name, label: t.name }));
    }
    return [];
  }, [academicYears, academicYear, yearToId]);

  const termToId = useMemo(() => {
    const map = new Map<string, string>();
    if (academicYear && Array.isArray(academicYears)) {
      const yearId = yearToId.get(academicYear);
      const year = academicYears.find((y) => y.id === yearId || y.name === academicYear);
      if (year && Array.isArray(year.terms)) {
        for (const t of year.terms) {
          map.set(t.name, t.id);
          map.set(t.id, t.id);
        }
      }
    }
    return map;
  }, [academicYears, academicYear, yearToId]);

  useEffect(() => {
    if (!Array.isArray(academicYears) || !academicYear) return;
    const id = yearToId.get(academicYear);
    if (id && id !== academicYearId) setAcademicYearId(id);
  }, [academicYears, academicYear, yearToId, academicYearId, setAcademicYearId]);

  useEffect(() => {
    if (!Array.isArray(academicYears) || !academicYear || !term) return;
    const id = termToId.get(term);
    if (id && id !== termId) setTermId(id);
  }, [academicYears, academicYear, term, termToId, termId, setTermId]);

  const { data: allStages } = useQuery({
    queryKey: ["curriculum-stages"],
    queryFn: async () => {
      const res = await api.get<{ id: string; name: string; grades: { id: string; name: string }[] }[]>("/curriculum/stages");
      return res.data ?? [];
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const gradeToId = useMemo(() => {
    const map = new Map<string, string>();
    if (isTeacher && myGrades && Array.isArray(myGrades.grades)) {
      for (const g of myGrades.grades) {
        map.set(g.name, g.id);
        map.set(g.id, g.id);
      }
    }
    if (isAdmin && Array.isArray(allStages)) {
      for (const stage of allStages) {
        if (stage && typeof stage === "object" && Array.isArray(stage.grades)) {
          for (const g of stage.grades) {
            map.set(g.name, g.id);
            map.set(g.id, g.id);
          }
        }
      }
    }
    return map;
  }, [isTeacher, isAdmin, myGrades, allStages]);

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
        "grid grid-cols-1 gap-2 pb-2",
        isAdmin ? "sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      role="group"
      aria-label="السياق الأكاديمي"
    >
      {isAdmin && (
        <Select
          size="sm"
          options={yearOptions}
          placeholder="السنة الدراسية"
          value={academicYear ?? ""}
          onChange={(e): void => {
            const selected = e.target.value;
            setAcademicYear(selected);
            setAcademicYearId(yearToId.get(selected) ?? null);
          }}
          aria-label="السنة الدراسية"
        />
      )}
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
      {isAdmin && (
        <Select
          size="sm"
          options={termOptions}
          placeholder="الترم"
          value={term ?? ""}
          onChange={(e): void => {
            const selected = e.target.value;
            setTerm(selected);
            setTermId(termToId.get(selected) ?? null);
          }}
          aria-label="الترم"
        />
      )}
    </div>
  );
}

export type { AcademicContextBarProps };
