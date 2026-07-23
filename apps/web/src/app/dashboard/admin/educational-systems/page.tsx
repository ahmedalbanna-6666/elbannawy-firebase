"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";

interface EducationalSystem {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEducationalSystemsPage(): ReactNode {
  const queryClient = useQueryClient();
  const { data: systems, isLoading, isError, error } = useQuery<EducationalSystem[]>({
    queryKey: ["admin-educational-systems"],
    queryFn: async () => {
      const res = await api.get<EducationalSystem[]>("/admin/educational-systems");
      return res.data ?? [];
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<EducationalSystem | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameAr, setFormNameAr] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; nameAr: string; description?: string }) => {
      const res = await api.post<EducationalSystem>("/admin/educational-systems", data);
      return res.data;
    },
    onSuccess: () => {
      setShowCreate(false);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-educational-systems"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; nameAr?: string; description?: string } }) => {
      const res = await api.patch<EducationalSystem>(`/admin/educational-systems/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      setEditTarget(null);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-educational-systems"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/educational-systems/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-educational-systems"] });
    },
  });

  const resetForm = (): void => {
    setFormName("");
    setFormNameAr("");
    setFormDesc("");
  };

  const openEdit = (sys: EducationalSystem): void => {
    setEditTarget(sys);
    setFormName(sys.name);
    setFormNameAr(sys.nameAr);
    setFormDesc(sys.description ?? "");
  };

  const handleSubmit = (): void => {
    if (!formName.trim() || !formNameAr.trim()) return;
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: { name: formName.trim(), nameAr: formNameAr.trim(), description: formDesc.trim() || undefined } });
    } else {
      createMutation.mutate({ name: formName.trim(), nameAr: formNameAr.trim(), description: formDesc.trim() || undefined });
    }
  };

  if (isLoading) return <EducationalSystemsSkeleton />;
  if (isError) return <ErrorState title="فشل التحميل" description={error instanceof Error ? error.message : "حدث خطأ"} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">الأنظمة التعليمية</h1>
          <p className="mt-1 text-sm text-neutral-500">إدارة الأنظمة التعليمية (مثال: النظام المصري، النظام السعودي)</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="ml-1 h-4 w-4" />
          إضافة نظام
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {!systems || systems.length === 0 ? (
            <EmptyState title="لا توجد أنظمة تعليمية" description="أضف النظام التعليمي الأول" icon={<GraduationCap className="h-12 w-12" />} />
          ) : (
            <div className="flex flex-col gap-3">
              {systems.map((sys) => (
                <div key={sys.id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{sys.nameAr}</span>
                        <span className="text-xs text-neutral-400">({sys.name})</span>
                        <Badge variant={sys.isActive ? "success" : "secondary"}>{sys.isActive ? "نشط" : "غير نشط"}</Badge>
                      </div>
                      {sys.description && <p className="text-xs text-neutral-500 mt-1">{sys.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { openEdit(sys); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => { if (confirm("هل أنت متأكد؟")) deleteMutation.mutate(sys.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate || !!editTarget} onClose={() => { setShowCreate(false); setEditTarget(null); }} title={editTarget ? "تعديل النظام التعليمي" : "إضافة نظام تعليمي"}>
        <DialogContent className="space-y-3">
          <Input placeholder="الاسم (إنجليزي)" value={formName} onChange={(e) => { setFormName(e.target.value); }} dir="ltr" />
          <Input placeholder="الاسم (عربي)" value={formNameAr} onChange={(e) => { setFormNameAr(e.target.value); }} />
          <Textarea placeholder="وصف (اختياري)" value={formDesc} onChange={(e) => { setFormDesc(e.target.value); }} />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowCreate(false); setEditTarget(null); }}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!formName.trim() || !formNameAr.trim() || createMutation.isPending || updateMutation.isPending}>
            {editTarget ? "حفظ" : "إضافة"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function EducationalSystemsSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
}
