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
import { Plus, Pencil, Trash2, Layers } from "lucide-react";

interface EducationalSystem {
  id: string;
  name: string;
  nameAr: string;
}

interface Stage {
  id: string;
  name: string;
  nameAr: string;
  educationalSystemId: string;
  order: number;
  isActive: boolean;
}

export default function AdminStagesPage(): ReactNode {
  const queryClient = useQueryClient();
  const { data: systems } = useQuery<EducationalSystem[]>({
    queryKey: ["admin-educational-systems"],
    queryFn: async () => {
      const res = await api.get<EducationalSystem[]>("/admin/educational-systems");
      return res.data ?? [];
    },
  });
  const { data: stages, isLoading, isError, error } = useQuery<Stage[]>({
    queryKey: ["admin-stages"],
    queryFn: async () => {
      const res = await api.get<Stage[]>("/admin/stages");
      return res.data ?? [];
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Stage | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameAr, setFormNameAr] = useState("");
  const [formSystemId, setFormSystemId] = useState("");
  const [formOrder, setFormOrder] = useState("0");

  const systemMap = useMemo(() => {
    const m = new Map<string, string>();
    if (systems) for (const s of systems) m.set(s.id, s.nameAr);
    return m;
  }, [systems]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; nameAr: string; educationalSystemId: string; order: number }) => {
      const res = await api.post<Stage>("/admin/stages", data);
      return res.data;
    },
    onSuccess: () => {
      setShowCreate(false);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-stages"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; nameAr?: string; order?: number } }) => {
      const res = await api.patch<Stage>(`/admin/stages/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      setEditTarget(null);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-stages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/stages/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-stages"] });
    },
  });

  const resetForm = (): void => {
    setFormName("");
    setFormNameAr("");
    setFormSystemId("");
    setFormOrder("0");
  };

  const openEdit = (stage: Stage): void => {
    setEditTarget(stage);
    setFormName(stage.name);
    setFormNameAr(stage.nameAr);
    setFormSystemId(stage.educationalSystemId);
    setFormOrder(String(stage.order));
  };

  const handleSubmit = (): void => {
    if (!formName.trim() || !formNameAr.trim() || !formSystemId) return;
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: { name: formName.trim(), nameAr: formNameAr.trim(), order: Number(formOrder) || 0 } });
    } else {
      createMutation.mutate({ name: formName.trim(), nameAr: formNameAr.trim(), educationalSystemId: formSystemId, order: Number(formOrder) || 0 });
    }
  };

  if (isLoading) return <StagesSkeleton />;
  if (isError) return <ErrorState title="فشل التحميل" description={error instanceof Error ? error.message : "حدث خطأ"} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">المراحل الدراسية</h1>
          <p className="mt-1 text-sm text-neutral-500">إدارة المراحل الدراسية (مثال: المرحلة الابتدائية، المرحلة الإعدادية)</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="ml-1 h-4 w-4" />
          إضافة مرحلة
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {!stages || stages.length === 0 ? (
            <EmptyState title="لا توجد مراحل دراسية" description="أضف المرحلة الدراسية الأولى" icon={<Layers className="h-12 w-12" />} />
          ) : (
            <div className="flex flex-col gap-3">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-primary-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{stage.nameAr}</span>
                        <span className="text-xs text-neutral-400">({stage.name})</span>
                        <Badge variant={stage.isActive ? "success" : "secondary"}>{stage.isActive ? "نشط" : "غير نشط"}</Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {systemMap.get(stage.educationalSystemId) || stage.educationalSystemId} — ترتيب: {stage.order}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { openEdit(stage); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => { if (confirm("هل أنت متأكد؟")) deleteMutation.mutate(stage.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate || !!editTarget} onClose={() => { setShowCreate(false); setEditTarget(null); }} title={editTarget ? "تعديل المرحلة" : "إضافة مرحلة"}>
        <DialogContent className="space-y-3">
          {!editTarget && (
            <Select
              placeholder="اختر النظام التعليمي"
              value={formSystemId}
              onChange={(e) => { setFormSystemId(e.target.value); }}
              options={(systems ?? []).map((sys) => ({ value: sys.id, label: `${sys.nameAr} (${sys.name})` }))}
            />
          )}
          <Input placeholder="الاسم (إنجليزي)" value={formName} onChange={(e) => { setFormName(e.target.value); }} dir="ltr" />
          <Input placeholder="الاسم (عربي)" value={formNameAr} onChange={(e) => { setFormNameAr(e.target.value); }} />
          <Input type="number" placeholder="ترتيب العرض" value={formOrder} onChange={(e) => { setFormOrder(e.target.value); }} />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowCreate(false); setEditTarget(null); }}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!formName.trim() || !formNameAr.trim() || (!editTarget && !formSystemId) || createMutation.isPending || updateMutation.isPending}>
            {editTarget ? "حفظ" : "إضافة"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function StagesSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
}
