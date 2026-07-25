import { BookOpen, Globe, type LucideIcon } from "lucide-react";
import type { SelectOption } from "@/components/ui/select";

export interface EducationOption {
  readonly id: string;
  readonly label: string;
  readonly icon?: LucideIcon;
}

export interface GradeOption {
  readonly id: string;
  readonly label: string;
  readonly stageId: string;
}

export const EDUCATIONAL_SYSTEMS: EducationOption[] = [
  { id: "GENERAL", label: "عام", icon: BookOpen },
  { id: "LANGUAGE", label: "لغات", icon: Globe },
  { id: "INTERNATIONAL", label: "دولي", icon: Globe },
];

export const EDUCATIONAL_STAGES: EducationOption[] = [
  { id: "PRIMARY", label: "ابتدائي" },
  { id: "PREPARATORY", label: "إعدادي" },
  { id: "SECONDARY", label: "ثانوي" },
];

export const GRADES: Record<string, readonly GradeOption[]> = {
  PRIMARY: [
    { id: "GRADE_1", label: "الصف الأول الابتدائي", stageId: "PRIMARY" },
    { id: "GRADE_2", label: "الصف الثاني الابتدائي", stageId: "PRIMARY" },
    { id: "GRADE_3", label: "الصف الثالث الابتدائي", stageId: "PRIMARY" },
    { id: "GRADE_4", label: "الصف الرابع الابتدائي", stageId: "PRIMARY" },
    { id: "GRADE_5", label: "الصف الخامس الابتدائي", stageId: "PRIMARY" },
    { id: "GRADE_6", label: "الصف السادس الابتدائي", stageId: "PRIMARY" },
  ] as const,
  PREPARATORY: [
    { id: "GRADE_7", label: "الصف الأول الإعدادي", stageId: "PREPARATORY" },
    { id: "GRADE_8", label: "الصف الثاني الإعدادي", stageId: "PREPARATORY" },
    { id: "GRADE_9", label: "الصف الثالث الإعدادي", stageId: "PREPARATORY" },
  ] as const,
  SECONDARY: [
    { id: "GRADE_10", label: "الصف الأول الثانوي", stageId: "SECONDARY" },
    { id: "GRADE_11", label: "الصف الثاني الثانوي", stageId: "SECONDARY" },
    { id: "GRADE_12", label: "الصف الثالث الثانوي", stageId: "SECONDARY" },
  ] as const,
};

export const SYSTEM_OPTIONS: SelectOption[] = EDUCATIONAL_SYSTEMS.map(
  (s): SelectOption => ({ value: s.id, label: s.label }),
);

export const STAGE_OPTIONS: SelectOption[] = EDUCATIONAL_STAGES.map(
  (s): SelectOption => ({ value: s.id, label: s.label }),
);

export function getGradeOptions(stageId: string): SelectOption[] {
  return (GRADES[stageId] ?? []).map((g): SelectOption => ({ value: g.id, label: g.label }));
}

export function stageLabelToKey(label: string): string | undefined {
  return EDUCATIONAL_STAGES.find((s) => s.label === label)?.id;
}

export const ACADEMIC_TERMS: EducationOption[] = [
  { id: "FIRST_TERM", label: "الترم الأول" },
  { id: "SECOND_TERM", label: "الترم الثاني" },
];

export function getStagesWithGrades(): { id: string; name: string; grades: { id: string; name: string }[] }[] {
  return EDUCATIONAL_STAGES.map((stage) => ({
    id: stage.id,
    name: stage.label,
    grades: (GRADES[stage.id] ?? []).map((g) => ({ id: g.id, name: g.label })),
  }));
}

export function findGradeIdByName(name: string): string | undefined {
  for (const grades of Object.values(GRADES)) {
    const found = grades.find((g) => g.id === name || g.label === name);
    if (found) return found.id;
  }
  return undefined;
}
