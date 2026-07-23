"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  nameAr: string;
  educationalSystemId: string;
}

interface Grade {
  id: string;
  name: string;
  nameAr: string;
  stageId: string;
  educationalSystemId: string;
  order: number;
  isActive: boolean;
}

export default function AdminGradesPage(): ReactNode {
  const queryClient = useQueryClient();
  const { data: stages } = useQuery<Stage[]>({
    queryKey: ["admin-stages"],
    queryFn: async () => {
      const res = await api.get<Stage[]>("/admin/stages");
      return res.data ?? [];
    },
  });
  const { data: grades, isLoading, isError, error } = useQuery<Grade[]>({
    queryKey: ["admin-grades"],
    queryFn: async () => {
      const res = await api.get<Grade[]>("/admin/grades");
      return res.data ?? [];
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Grade | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameAr, setFormNameAr] = useState("");
  const [formStageId, setFormStageId] = useState("");
  const [formOrder, setFormOrder] = useState("0");

  const stageMap = useMemo(() => {
    const m = new Map<string, string>();
    if (stages) for (const s of stages) m.set(s.id, s.nameAr);
    return m;
  }, [stages]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; nameAr: string; stageId: string; educationalSystemId: string; order: number }) => {
      const res = await api.post<Grade>("/admin/grades", data);
      return res.data;
    },
    onSuccess: () => {
      setShowCreate(false);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-grades"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; nameAr?: string; order?: number } }) => {
      const res = await api.patch<Grade>(`/admin/grades/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      setEditTarget(null);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-grades"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/grades/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-grades"] });
    },
  });

  const resetForm = (): void => {
    setFormName("");
    setFormNameAr("");
    setFormStageId("");
    setFormOrder("0");
  };

  const openEdit = (grade: Grade): void => {
    setEditTarget(grade);
    setFormName(grade.name);
    setFormNameAr(grade.nameAr);
    setFormStageId(grade.stageId);
    setFormOrder(String(grade.order));
  };

  const selectedStage = useMemo(() => {
    if (!formStageId || !stages) return null;
    return stages.find((s) => s.id === formStageId) ?? null;
  }, [formStageId, stages]);

  const handleSubmit = (): void => {
    if (!formName.trim() || !formNameAr.trim() || !formStageId) return;
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: { name: formName.trim(), nameAr: formNameAr.trim(), order: Number(formOrder) || 0 } });
    } else {
      if (!selectedStage) return;
      createMutation.mutate({
        name: formName.trim(),
        nameAr: formNameAr.trim(),
        stageId: formStageId,
        educationalSystemId: selectedStage.educationalSystemId,
        order: Number(formOrder) || 0,
      });
    }
  };

  if (isLoading) return <GradesSkeleton />;
  if (isError) return <ErrorState title="فشل التحميل" description={error instanceof Error ? error.message : "حدث خطأ"} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">الصفوف الدراسية</h1>
          <p className="mt-1 text-sm text-neutral-500">إدارة الصفوف الدراسية لكل مرحلة</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="ml-1 h-4 w-4" />
          إضافة صف
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {!grades || grades.length === 0 ? (
            <EmptyState title="لا توجد صفوف دراسية" description="أضف الصف الدراسي الأول" icon={<BookOpen className="h-12 w-12" />} />
          ) : (
            <div className="flex flex-col gap-3">
              {grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{grade.nameAr}</span>
                        <span className="text-xs text-neutral-400">({grade.name})</span>
                        <Badge variant={grade.isActive ? "success" : "secondary"}>{grade.isActive ? "نشط" : "غير نشط"}</Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {stageMap.get(grade.stageId) || grade.stageId} — ترتيب: {grade.order}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { openEdit(grade); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => { if (confirm("هل أنت متأكد؟")) deleteMutation.mutate(grade.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate || !!editTarget} onClose={() => { setShowCreate(false); setEditTarget(null); }} title={editTarget ? "تعديل الصف" : "إضافة صف"}>
        <DialogContent className="space-y-3">
          {!editTarget && (
            <Select
              placeholder="اختر المرحلة الدراسية"
              value={formStageId}
              onChange={(e) => { setFormStageId(e.target.value); }}
              options={(stages ?? []).map((s) => ({ value: s.id, label: `${s.nameAr} (${s.name})` }))}
            />
          )}
          <Input placeholder="الاسم (إنجليزي)" value={formName} onChange={(e) => { setFormName(e.target.value); }} dir="ltr" />
          <Input placeholder="الاسم (عربي)" value={formNameAr} onChange={(e) => { setFormNameAr(e.target.value); }} />
          <Input type="number" placeholder="ترتيب العرض" value={formOrder} onChange={(e) => { setFormOrder(e.target.value); }} />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowCreate(false); setEditTarget(null); }}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!formName.trim() || !formNameAr.trim() || !formStageId || createMutation.isPending || updateMutation.isPending}>
            {editTarget ? "حفظ" : "إضافة"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function GradesSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
}
