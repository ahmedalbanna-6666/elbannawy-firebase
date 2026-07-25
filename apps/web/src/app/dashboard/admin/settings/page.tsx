"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Calendar,
  BookOpen,
  Layers,
  CheckCircle2,
  Wrench,
  Sparkles,
  Coins,
  Gauge,
  Save,
  X,
} from "lucide-react";
import {
  useAiConfig,
  useUpdateAiConfig,
  useAiLimits,
  useUpdateAiLimits,
  useAiPricingPlans,
  useCreateAiPricingPlan,
  useUpdateAiPricingPlan,
  useDeleteAiPricingPlan,
  type AiConfig,
  type AiConsumptionLimits,
  type AiTokenPricingPlan,
} from "@/lib/ai/ai-admin-api";

interface SystemSettings {
  termManagementMode: "AUTO" | "MANUAL";
  activeAcademicYearId: string | null;
  activeTermId: string | null;
  autoTermStartDate: string | null;
  autoTermEndDate: string | null;
  maintenanceMode: boolean;
}

interface Term {
  id: string;
  name: string;
  academicYearId: string;
  displayOrder: number;
}

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  terms: Term[];
  _count: { users: number; units: number };
}

function useSettings(): UseQueryResult<SystemSettings | null> {
  return useQuery<SystemSettings | null>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await api.get<SystemSettings>("/admin/settings");
      return res.data ?? null;
    },
    staleTime: 30_000,
  });
}

function useAcademicYears(): UseQueryResult<AcademicYear[]> {
  return useQuery<AcademicYear[]>({
    queryKey: ["admin-academic-years"],
    queryFn: async () => {
      const res = await api.get<AcademicYear[]>("/admin/academic-years");
      return res.data ?? [];
    },
    staleTime: 30_000,
  });
}

export default function AdminSettingsPage(): ReactNode {
  const queryClient = useQueryClient();
  const { data: settings, isLoading: settingsLoading, isError: settingsError, error: settingsErr } = useSettings();
  const { data: academicYears, isLoading: yearsLoading } = useAcademicYears();

  const [showCreateYear, setShowCreateYear] = useState(false);
  const [showCreateTerm, setShowCreateTerm] = useState<string | null>(null);
  const [editYearId, setEditYearId] = useState<string | null>(null);
  const [editTermId, setEditTermId] = useState<string | null>(null);

  const [newYearName, setNewYearName] = useState("");
  const [editYearName, setEditYearName] = useState("");
  const [newTermName, setNewTermName] = useState("");
  const [newTermOrder, setNewTermOrder] = useState("0");
  const [editTermName, setEditTermName] = useState("");
  const [editTermOrder, setEditTermOrder] = useState("0");

  const [autoStartDate, setAutoStartDate] = useState("");
  const [autoEndDate, setAutoEndDate] = useState("");

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: Partial<SystemSettings>) => {
      const res = await api.patch<SystemSettings>("/admin/settings", payload);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-active-context"] });
      void queryClient.invalidateQueries({ queryKey: ["active-academic-context"] });
    },
  });

  const createYearMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post<AcademicYear>("/admin/academic-years", { name });
      return res.data;
    },
    onSuccess: () => {
      setShowCreateYear(false);
      setNewYearName("");
      void queryClient.invalidateQueries({ queryKey: ["admin-academic-years"] });
    },
  });

  const updateYearMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; isActive?: boolean } }) => {
      const res = await api.patch<AcademicYear>(`/admin/academic-years/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      setEditYearId(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-academic-years"] });
    },
  });

  const deleteYearMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/academic-years/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-academic-years"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  const createTermMutation = useMutation({
    mutationFn: async ({ academicYearId, name, displayOrder }: { academicYearId: string; name: string; displayOrder: number }) => {
      const res = await api.post<Term>(`/admin/academic-years/${academicYearId}/terms`, { name, displayOrder });
      return res.data;
    },
    onSuccess: () => {
      setShowCreateTerm(null);
      setNewTermName("");
      setNewTermOrder("0");
      void queryClient.invalidateQueries({ queryKey: ["admin-academic-years"] });
    },
  });

  const updateTermMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; displayOrder?: number } }) => {
      const res = await api.patch<Term>(`/admin/terms/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      setEditTermId(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-academic-years"] });
    },
  });

  const deleteTermMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/terms/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-academic-years"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  const handleToggleMode = (): void => {
    const newMode = settings?.termManagementMode === "AUTO" ? "MANUAL" : "AUTO";
    updateSettingsMutation.mutate({ termManagementMode: newMode });
  };

  const handleSetActiveYear = (yearId: string): void => {
    updateSettingsMutation.mutate({ activeAcademicYearId: yearId });
  };

  const handleSetActiveTerm = (termId: string): void => {
    updateSettingsMutation.mutate({ activeTermId: termId });
  };

  const handleSaveAutoDates = (): void => {
    updateSettingsMutation.mutate({
      autoTermStartDate: autoStartDate || null,
      autoTermEndDate: autoEndDate || null,
    });
  };

  if (settingsLoading || yearsLoading) return <AdminSettingsSkeleton />;
  if (settingsError) return <ErrorState title="فشل التحميل" description={settingsErr instanceof Error ? settingsErr.message : "حدث خطأ"} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">إعدادات المنصة</h1>
          <p className="mt-1 text-sm text-neutral-500">إدارة الإعدادات العامة للمنصة والسنوات الدراسية</p>
        </div>
      </div>

      {/* Term Management Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ToggleLeft className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">نظام إدارة الترم</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">
                {settings?.termManagementMode === "AUTO" ? "تلقائي" : "يدوي"}
              </span>
              <Button
                variant={settings?.termManagementMode === "AUTO" ? "primary" : "secondary"}
                size="sm"
                onClick={handleToggleMode}
              >
                {settings?.termManagementMode === "AUTO" ? "تلقائي" : "يدوي"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            {settings?.termManagementMode === "AUTO"
              ? "يتم تحديد الترم النشط تلقائياً بناءً على التواريخ المحددة."
              : "يتم تحديد الترم النشط يدوياً بواسطة المسؤول."}
          </p>

          {settings?.termManagementMode === "AUTO" && (
            <div className="mt-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">تاريخ البداية</label>
                <Input
                  type="date"
                  value={autoStartDate || (settings.autoTermStartDate?.split("T")[0] ?? "")}
                  onChange={(e): void => { setAutoStartDate(e.target.value); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">تاريخ النهاية</label>
                <Input
                  type="date"
                  value={autoEndDate || (settings.autoTermEndDate?.split("T")[0] ?? "")}
                  onChange={(e): void => { setAutoEndDate(e.target.value); }}
                />
              </div>
              <Button size="sm" onClick={handleSaveAutoDates}>
                <Calendar className="ml-1 h-4 w-4" />
                حفظ التواريخ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">وضع الصيانة</h2>
            </div>
            <Button
              variant={settings?.maintenanceMode ? "danger" : "secondary"}
              size="sm"
              onClick={() => { updateSettingsMutation.mutate({ maintenanceMode: !settings?.maintenanceMode }); }}
            >
              {settings?.maintenanceMode ? "مفعل" : "معطل"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            {settings?.maintenanceMode
              ? "المنصة في وضع الصيانة. لن يتمكن المستخدمون من الدخول."
              : "المنصة تعمل بشكل طبيعي. المستخدمون يمكنهم الدخول."}
          </p>
        </CardContent>
      </Card>

      {/* AI Model Configuration */}
      <AiConfigSection />

      {/* AI Consumption Limits */}
      <AiLimitsSection />

      {/* AI Token Pricing */}
      <AiPricingSection />

      {/* Current Active Context */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">السياق الأكاديمي النشط</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-4">
              <span className="text-sm text-neutral-500">السنة الدراسية النشطة</span>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {academicYears?.find((y) => y.id === settings?.activeAcademicYearId)?.name ?? "غير محدد"}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-4">
              <span className="text-sm text-neutral-500">الترم النشط</span>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {(() : string => {
                  const year = academicYears?.find((y) => y.id === settings?.activeAcademicYearId);
                  const term = year?.terms.find((t) => t.id === settings?.activeTermId);
                  return term?.name ?? "غير محدد";
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Years */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">السنوات الدراسية</h2>
            </div>
            <Button size="sm" onClick={() => { setShowCreateYear(true); }}>
              <Plus className="ml-1 h-4 w-4" />
              إضافة سنة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!academicYears || academicYears.length === 0 ? (
            <EmptyState title="لا توجد سنوات دراسية" description="أضف السنة الدراسية الأولى" icon={<Layers className="h-12 w-12" />} />
          ) : (
            <div className="flex flex-col gap-4">
              {academicYears.map((year) => (
                <div key={year.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{year.name}</span>
                      {year.isActive && (
                        <span className="rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs text-green-700 dark:text-green-300">
                          نشط
                        </span>
                      )}
                      {settings?.activeAcademicYearId === year.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">{year._count.users} طالب</span>
                      {settings?.termManagementMode === "MANUAL" && (
                        <Button
                          size="sm"
                          variant={settings.activeAcademicYearId === year.id ? "primary" : "outline"}
                          onClick={() => { handleSetActiveYear(year.id); }}
                        >
                          تعيين نشط
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { setEditYearId(year.id); setEditYearName(year.name); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { deleteYearMutation.mutate(year.id); }} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="mr-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">الترمات</span>
                      <Button size="sm" variant="outline" onClick={() => { setShowCreateTerm(year.id); }}>
                        <Plus className="h-3 w-3 ml-1" />
                        إضافة ترم
                      </Button>
                    </div>
                    {year.terms.length === 0 ? (
                      <p className="text-sm text-neutral-400">لا توجد ترمات</p>
                    ) : (
                      year.terms.map((term) => (
                        <div key={term.id} className="flex items-center justify-between rounded-md bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-800 dark:text-neutral-200">{term.name}</span>
                            <span className="text-xs text-neutral-400">ترتيب: {term.displayOrder}</span>
                            {settings?.activeTermId === term.id && (
                              <CheckCircle2 className="h-3 w-3 text-primary-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {settings?.termManagementMode === "MANUAL" && (
                              <Button
                                size="sm"
                                variant={settings.activeTermId === term.id ? "primary" : "ghost"}
                                onClick={() => { handleSetActiveTerm(term.id); }}
                              >
                                تعيين
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => { setEditTermId(term.id); setEditTermName(term.name); setEditTermOrder(String(term.displayOrder)); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { deleteTermMutation.mutate(term.id); }} className="text-red-500">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Year Dialog */}
      <Dialog open={showCreateYear} onClose={() => { setShowCreateYear(false); }} title="إضافة سنة دراسية">
        <DialogContent>
          <Input
            placeholder="اسم السنة الدراسية (مثال: 2025-2026)"
            value={newYearName}
            onChange={(e) => { setNewYearName(e.target.value); }}
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowCreateYear(false); }}>إلغاء</Button>
          <Button onClick={() => { if (newYearName.trim()) createYearMutation.mutate(newYearName.trim()); }} disabled={!newYearName.trim()}>إضافة</Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Year Dialog */}
      <Dialog open={!!editYearId} onClose={() => { setEditYearId(null); }} title="تعديل السنة الدراسية">
        <DialogContent>
          <Input
            placeholder="اسم السنة الدراسية"
            value={editYearName}
            onChange={(e) => { setEditYearName(e.target.value); }}
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setEditYearId(null); }}>إلغاء</Button>
          <Button onClick={() => { if (editYearName.trim() && editYearId) updateYearMutation.mutate({ id: editYearId, data: { name: editYearName.trim() } }); }} disabled={!editYearName.trim()}>حفظ</Button>
        </DialogFooter>
      </Dialog>

      {/* Create Term Dialog */}
      <Dialog open={!!showCreateTerm} onClose={() => { setShowCreateTerm(null); }} title="إضافة ترم">
        <DialogContent className="space-y-3">
          <Input
            placeholder="اسم الترم (مثال: الترم الأول)"
            value={newTermName}
            onChange={(e) => { setNewTermName(e.target.value); }}
          />
          <Input
            type="number"
            placeholder="ترتيب العرض"
            value={newTermOrder}
            onChange={(e) => { setNewTermOrder(e.target.value); }}
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowCreateTerm(null); }}>إلغاء</Button>
          <Button onClick={() => { if (newTermName.trim() && showCreateTerm) createTermMutation.mutate({ academicYearId: showCreateTerm, name: newTermName.trim(), displayOrder: Number(newTermOrder) || 0 }); }} disabled={!newTermName.trim()}>إضافة</Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Term Dialog */}
      <Dialog open={!!editTermId} onClose={() => { setEditTermId(null); }} title="تعديل الترم">
        <DialogContent className="space-y-3">
          <Input
            placeholder="اسم الترم"
            value={editTermName}
            onChange={(e) => { setEditTermName(e.target.value); }}
          />
          <Input
            type="number"
            placeholder="ترتيب العرض"
            value={editTermOrder}
            onChange={(e) => { setEditTermOrder(e.target.value); }}
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setEditTermId(null); }}>إلغاء</Button>
          <Button onClick={() => { if (editTermName.trim() && editTermId) updateTermMutation.mutate({ id: editTermId, data: { name: editTermName.trim(), displayOrder: Number(editTermOrder) || 0 } }); }} disabled={!editTermName.trim()}>حفظ</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

/* ───── AI Model Configuration ───── */
function AiConfigSection(): ReactNode {
  const { data: config, isLoading, isError } = useAiConfig();
  const { mutateAsync: updateConfig, isPending: saving } = useUpdateAiConfig();
  const [local, setLocal] = useState<Partial<AiConfig> | null>(null);

  const vals = local ?? config;

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (isError) return <ErrorState title="فشل تحميل إعدادات الذكاء الاصطناعي" description="حدث خطأ أثناء تحميل الإعدادات" />;
  if (!vals) return null;

  const handleSave = async (): Promise<void> => {
    if (!local) return;
    try {
      await updateConfig(local);
      setLocal(null);
    } catch { /* handled */ }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">إعدادات نموذج الذكاء الاصطناعي</h2>
          </div>
          <div className="flex items-center gap-2">
            {local && (
              <>
                <Button variant="outline" size="sm" onClick={() => { setLocal(null); }}>
                  <X className="h-4 w-4" />
                  إلغاء
                </Button>
                <Button size="sm" loading={saving} onClick={() => { void handleSave(); }}>
                  <Save className="h-4 w-4" />
                  حفظ
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">مزود الخدمة</label>
            <select
              className="h-12 w-full rounded-xl border-2 border-neutral-300 bg-transparent px-4 text-base text-neutral-900 transition-all focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:text-neutral-100"
              value={(vals as AiConfig).provider ?? "openai"}
              onChange={(e) => { setLocal((p) => ({ ...p, ...config, provider: e.target.value })); }}
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="deepseek">DeepSeek</option>
              <option value="claude">Anthropic Claude</option>
              <option value="custom">مخصص (Custom)</option>
            </select>
          </div>
          <Input
            label="الموديل (Model)"
            value={vals.model ?? ""}
            onChange={(e) => { setLocal((p) => ({ ...p, ...config, model: e.target.value })); }}
            placeholder="gpt-4o-mini"
          />
          <div className="md:col-span-2">
            <Input
              label="رابط API Endpoint"
              value={vals.endpoint ?? ""}
              onChange={(e) => { setLocal((p) => ({ ...p, ...config, endpoint: e.target.value })); }}
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="مفتاح API"
              type="password"
              value={vals.apiKey ?? ""}
              onChange={(e) => { setLocal((p) => ({ ...p, ...config, apiKey: e.target.value })); }}
              placeholder="sk-..."
            />
          </div>
          <Input
            label="درجة الحرارة (Temperature)"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={String(vals.temperature ?? 0.7)}
            onChange={(e) => { setLocal((p) => ({ ...p, ...config, temperature: Number(e.target.value) })); }}
          />
          <Input
            label="الحد الأقصى للتوكنز (Max Tokens)"
            type="number"
            min="1"
            max="32000"
            value={String(vals.maxTokens ?? 2048)}
            onChange={(e) => { setLocal((p) => ({ ...p, ...config, maxTokens: Number(e.target.value) })); }}
          />
        </div>

        <div className="mt-4 space-y-4">
          <Switch
            label="تفعيل نظام RAG (البحث في المصادر)"
            helperText="عند التفعيل، سيتم البحث في المحتوى التعليمي قبل الرد على الطالب"
            checked={vals.ragEnabled ?? true}
            onChange={(e) => { setLocal((p) => ({ ...p, ...config, ragEnabled: e.target.checked })); }}
          />
          {vals.ragEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
              <Input
                label="عدد النتائج القصوى (RAG Max Results)"
                type="number"
                min="1"
                max="20"
                value={String(vals.ragMaxResults ?? 5)}
                onChange={(e) => { setLocal((p) => ({ ...p, ...config, ragMaxResults: Number(e.target.value) })); }}
              />
              <Input
                label="حد التشابه (Similarity Threshold)"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={String(vals.ragSimilarityThreshold ?? 0.7)}
                onChange={(e) => { setLocal((p) => ({ ...p, ...config, ragSimilarityThreshold: Number(e.target.value) })); }}
              />
            </div>
          )}
        </div>

        {!local && config && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => { setLocal(config); }}>
              <Pencil className="h-4 w-4" />
              تعديل الإعدادات
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ───── AI Consumption Limits ───── */
function AiLimitsSection(): ReactNode {
  const { data: limits, isLoading, isError } = useAiLimits();
  const { mutateAsync: updateLimits, isPending: saving } = useUpdateAiLimits();
  const [local, setLocal] = useState<Partial<AiConsumptionLimits> | null>(null);

  const vals = local ?? limits;

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (isError) return <ErrorState title="فشل تحميل حدود الاستهلاك" description="حدث خطأ أثناء تحميل الحدود" />;
  if (!vals) return null;

  const handleSave = async (): Promise<void> => {
    if (!local) return;
    try {
      await updateLimits(local);
      setLocal(null);
    } catch { /* handled */ }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">حدود استهلاك الذكاء الاصطناعي</h2>
          </div>
          <div className="flex items-center gap-2">
            {local && (
              <>
                <Button variant="outline" size="sm" onClick={() => { setLocal(null); }}>
                  <X className="h-4 w-4" />
                  إلغاء
                </Button>
                <Button size="sm" loading={saving} onClick={() => { void handleSave(); }}>
                  <Save className="h-4 w-4" />
                  حفظ
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">نوع الحد</label>
            <select
              className="h-12 w-full rounded-xl border-2 border-neutral-300 bg-transparent px-4 text-base text-neutral-900 transition-all focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:text-neutral-100"
              value={vals.limitType ?? "messages"}
              onChange={(e) => { setLocal((p) => ({ ...p, ...limits, limitType: e.target.value as "messages" | "tokens" })); }}
            >
              <option value="messages">عدد الرسائل</option>
              <option value="tokens">عدد التوكنز</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">دورة إعادة التعيين</label>
            <select
              className="h-12 w-full rounded-xl border-2 border-neutral-300 bg-transparent px-4 text-base text-neutral-900 transition-all focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:text-neutral-100"
              value={vals.resetPeriod ?? "daily"}
              onChange={(e) => { setLocal((p) => ({ ...p, ...limits, resetPeriod: e.target.value as "daily" | "monthly" })); }}
            >
              <option value="daily">يومي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>

          <div className="md:col-span-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">حدود الطالب</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={vals.limitType === "tokens" ? "الحد اليومي للتوكنز" : "الحد اليومي للرسائل"}
                type="number"
                min="0"
                value={String(vals.limitType === "tokens" ? vals.studentTokensPerDay ?? 10000 : vals.studentDailyLimit ?? 50)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLocal((p) => ({ ...p, ...limits, ...(vals.limitType === "tokens" ? { studentTokensPerDay: v } : { studentDailyLimit: v }) }));
                }}
              />
              <Input
                label={vals.limitType === "tokens" ? "الحد الشهري للتوكنز" : "الحد الشهري للرسائل"}
                type="number"
                min="0"
                value={String(vals.limitType === "tokens" ? vals.studentTokensPerMonth ?? 100000 : vals.studentMonthlyLimit ?? 500)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLocal((p) => ({ ...p, ...limits, ...(vals.limitType === "tokens" ? { studentTokensPerMonth: v } : { studentMonthlyLimit: v }) }));
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">حدود المعلم</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="الحد اليومي للمعلم"
                type="number"
                min="0"
                value={String(vals.teacherDailyLimit ?? 300)}
                onChange={(e) => { setLocal((p) => ({ ...p, ...limits, teacherDailyLimit: Number(e.target.value) })); }}
              />
              <Input
                label="الحد الشهري للمعلم"
                type="number"
                min="0"
                value={String(vals.teacherMonthlyLimit ?? 3000)}
                onChange={(e) => { setLocal((p) => ({ ...p, ...limits, teacherMonthlyLimit: Number(e.target.value) })); }}
              />
            </div>
          </div>
        </div>

        {!local && limits && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => { setLocal(limits); }}>
              <Pencil className="h-4 w-4" />
              تعديل الحدود
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ───── AI Token Pricing ───── */
function AiPricingSection(): ReactNode {
  const { data: plans, isLoading, isError, refetch } = useAiPricingPlans();
  const { mutateAsync: createPlan } = useCreateAiPricingPlan();
  const { mutateAsync: updatePlan } = useUpdateAiPricingPlan();
  const { mutateAsync: deletePlan } = useDeleteAiPricingPlan();

  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<AiTokenPricingPlan | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formMin, setFormMin] = useState("");
  const [formMax, setFormMax] = useState("");
  const [formCoins, setFormCoins] = useState("");

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (isError) return <ErrorState title="فشل تحميل خطط الأسعار" description="حدث خطأ أثناء تحميل خطط الأسعار" />;

  const openCreate = (): void => {
    setEditPlan(null);
    setFormName("");
    setFormDesc("");
    setFormMin("");
    setFormMax("");
    setFormCoins("");
    setShowForm(true);
  };

  const openEdit = (plan: AiTokenPricingPlan): void => {
    setEditPlan(plan);
    setFormName(plan.name);
    setFormDesc(plan.description ?? "");
    setFormMin(String(plan.minTokens));
    setFormMax(plan.maxTokens !== null ? String(plan.maxTokens) : "");
    setFormCoins(String(plan.coinsPerToken));
    setShowForm(true);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formName.trim() || !formMin || !formCoins) return;
    try {
      if (editPlan) {
        await updatePlan({
          id: editPlan.id,
          data: {
            name: formName.trim(),
            description: formDesc.trim() || null,
            minTokens: Number(formMin),
            maxTokens: formMax ? Number(formMax) : null,
            coinsPerToken: Number(formCoins),
          },
        });
      } else {
        await createPlan({
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          minTokens: Number(formMin),
          maxTokens: formMax ? Number(formMax) : undefined,
          coinsPerToken: Number(formCoins),
        });
      }
      setShowForm(false);
      setEditPlan(null);
      void refetch();
    } catch { /* handled */ }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("هل أنت متأكد من حذف خطة السعر هذه؟")) return;
    try {
      await deletePlan(id);
      void refetch();
    } catch { /* handled */ }
  };

  const handleToggleActive = async (plan: AiTokenPricingPlan): Promise<void> => {
    try {
      await updatePlan({ id: plan.id, data: { active: !plan.active } });
      void refetch();
    } catch { /* handled */ }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">أسعار التوكنز بالعملات</h2>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            إضافة خطة
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-500 mb-4">
          حدد أسعار باقات التوكنز بالعملات (Coins). بعد نفاد حد الاستهلاك اليومي، سيتم خصم العملات مقابل التوكنز حسب الخطة.
        </p>

        {!plans || plans.length === 0 ? (
          <EmptyState title="لا توجد خطط أسعار" description="أضف خطة تسعير أولى للتوكنز" icon={<Coins className="h-12 w-12" />} />
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{plan.name}</span>
                    <Badge variant={plan.active ? "success" : "secondary"}>
                      {plan.active ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-neutral-500 mt-1">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <span>الحد الأدنى: <strong>{plan.minTokens.toLocaleString()}</strong> توكن</span>
                    <span>الحد الأقصى: <strong>{plan.maxTokens ? plan.maxTokens.toLocaleString() : "غير محدود"}</strong> توكن</span>
                    <span className="text-amber-500 font-semibold">{plan.coinsPerToken} عملة / توكن</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mr-4">
                  <Button variant="outline" size="xs" onClick={() => { void handleToggleActive(plan); }}>
                    {plan.active ? "تعطيل" : "تفعيل"}
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => { openEdit(plan); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="danger" size="xs" onClick={() => { void handleDelete(plan.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditPlan(null); }}>
          <DialogContent>
            <DialogHeader>
              <h2 className="text-lg font-semibold">{editPlan ? "تعديل خطة السعر" : "إضافة خطة سعر جديدة"}</h2>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input label="اسم الخطة" value={formName} onChange={(e) => { setFormName(e.target.value); }} required />
              <Input label="الوصف" value={formDesc} onChange={(e) => { setFormDesc(e.target.value); }} />
              <Input label="الحد الأدنى للتوكنز" type="number" min="0" value={formMin} onChange={(e) => { setFormMin(e.target.value); }} required />
              <Input label="الحد الأقصى للتوكنز (اختياري)" type="number" min="0" value={formMax} onChange={(e) => { setFormMax(e.target.value); }} />
              <Input label="عدد العملات لكل توكن" type="number" step="0.01" min="0" value={formCoins} onChange={(e) => { setFormCoins(e.target.value); }} required />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditPlan(null); }}>إلغاء</Button>
              <Button onClick={() => { void handleSubmit(); }} disabled={!formName.trim() || !formMin || !formCoins}>
                {editPlan ? "حفظ التغييرات" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function AdminSettingsSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
    </div>
  );
}
