"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ArrowLeft, Save, Coins, ShoppingBag, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

function PriceCard({
  title,
  description,
  icon,
  value,
  onChange,
  onSave,
  saving,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}): ReactNode {
  return (
    <Card variant="elevated" padding="md">
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
              <p className="text-sm text-neutral-500">{description}</p>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                السعر (عملات)
              </label>
              <Input
                type="number"
                min="1"
                value={value}
                onChange={(e) => { onChange(e.target.value); }}
                placeholder="عدد العملات"
              />
            </div>
            <Button size="sm" onClick={onSave} disabled={saving || !value}>
              <Save className="h-4 w-4" />
              حفظ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContentPricingPage(): ReactNode {
  const router = useRouter();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const canManage = can("content_pricing.manage");

  const [unitPrice, setUnitPrice] = useState("");
  const [termPrice, setTermPrice] = useState("");

  const { data: unitData, isLoading: unitLoading } = useQuery({
    queryKey: ["content-pricing", "UNIT"],
    queryFn: async () => {
      const res = await api.get<{ cost: number }>("/coins/unlock-cost/UNIT");
      return res.data;
    },
  });

  const { data: termData, isLoading: termLoading } = useQuery({
    queryKey: ["content-pricing", "TERM"],
    queryFn: async () => {
      const res = await api.get<{ cost: number }>("/coins/unlock-cost/TERM_SUBSCRIPTION");
      return res.data;
    },
  });

  useEffect(() => {
    if (unitData) setUnitPrice(String(unitData.cost));
    if (termData) setTermPrice(String(termData.cost));
  }, [unitData, termData]);

  const saveMutation = useMutation({
    mutationFn: async ({ targetType, cost }: { targetType: string; cost: number }) =>
      api.post("/coins/unlock-cost", { targetType, cost }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["content-pricing"] });
    },
  });

  const handleSave = (targetType: string, cost: string): void => {
    const num = Number(cost);
    if (num <= 0) return;
    saveMutation.mutate({ targetType, cost: num });
  };

  if (!canManage) {
    return (
      <ErrorState
        title="لا تملك صلاحية الوصول"
        description="فقط المديرون يمكنهم إدارة أسعار المحتوى."
      />
    );
  }

  if (unitLoading || termLoading) {
    return (
      <div className="flex flex-col gap-6 pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <button onClick={() => { router.push("/dashboard/admin"); }} className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 w-fit">
        <ArrowLeft className="h-4 w-4" />
        العودة للإدارة
      </button>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">إدارة أسعار المحتوى</h1>
        <p className="mt-1 text-sm text-neutral-500">تحديد أسعار فتح المحتوى التعليمي للطلاب</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PriceCard
          title="شراء وحدة واحدة"
          description="يشتري الطالب وحدة واحدة فقط بمجرد الدفع"
          icon={<ShoppingBag className="h-6 w-6 text-amber-500" />}
          value={unitPrice}
          onChange={setUnitPrice}
          onSave={() => { handleSave("UNIT", unitPrice); }}
          saving={saveMutation.isPending}
        />

        <PriceCard
          title="اشتراك الترم كامل"
          description="يدفع الطالب مرة واحدة ويحصل على كل المحتوى في الترم"
          icon={<CreditCard className="h-6 w-6 text-amber-500" />}
          value={termPrice}
          onChange={setTermPrice}
          onSave={() => { handleSave("TERM_SUBSCRIPTION", termPrice); }}
          saving={saveMutation.isPending}
        />
      </div>

      {saveMutation.isSuccess && (
        <p className="text-sm text-success-500">تم حفظ الأسعار بنجاح</p>
      )}
    </div>
  );
}
