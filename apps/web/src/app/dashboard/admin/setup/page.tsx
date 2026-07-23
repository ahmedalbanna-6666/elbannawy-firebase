"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Wrench,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Database,
  Users,
} from "lucide-react";

interface MigrationResult {
  totalFirebaseUsers: number;
  created: number;
  skipped: number;
  errors: number;
  details: string[];
}

interface PermissionsResult {
  updated: number;
  skipped: number;
  errors: number;
  details: string[];
}

export default function AdminSetupPage(): ReactNode {
  const [migrateResult, setMigrateResult] = useState<MigrationResult | null>(null);
  const [permResult, setPermResult] = useState<PermissionsResult | null>(null);

  const migrateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<MigrationResult>("/admin/migrate");
      return res.data ?? null;
    },
    onSuccess: (data) => setMigrateResult(data),
  });

  const permissionsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<PermissionsResult>("/admin/migrate/permissions");
      return res.data ?? null;
    },
    onSuccess: (data) => setPermResult(data),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10">
          <Wrench className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            أدوات الإعداد
          </h1>
          <p className="text-sm text-neutral-500">
            ترحيل البيانات وإعداد النظام للعمل مع Firestore
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              مزامنة مستخدمي Firebase
            </h2>
          </div>
          <p className="text-sm text-neutral-500">
            إنشاء وثائق في Firestore لكل مستخدم موجود في Firebase Authentication.
            هذا ضروري لكي يتمكن المدرسون من تسجيل الدخول ورؤية لوحة التحكم.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            variant="primary"
            onClick={() => migrateMutation.mutate()}
            disabled={migrateMutation.isPending}
            className="self-start"
          >
            {migrateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {migrateMutation.isPending ? "جارٍ المزامنة..." : "بدء المزامنة"}
          </Button>

          {migrateMutation.isError && (
            <ErrorState
              title="فشلت المزامنة"
              description={migrateMutation.error?.message ?? "حدث خطأ غير متوقع"}
            />
          )}

          {migrateResult && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 className="mb-2 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                نتيجة المزامنة
              </h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">
                  <Users className="h-3 w-3" />
                  الإجمالي: {migrateResult.totalFirebaseUsers}
                </Badge>
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  تم الإنشاء: {migrateResult.created}
                </Badge>
                <Badge variant="secondary">
                  موجود مسبقاً: {migrateResult.skipped}
                </Badge>
                {migrateResult.errors > 0 && (
                  <Badge variant="danger">
                    <AlertTriangle className="h-3 w-3" />
                    أخطاء: {migrateResult.errors}
                  </Badge>
                )}
              </div>
              {migrateResult.details.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700">
                    عرض التفاصيل ({migrateResult.details.length})
                  </summary>
                  <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {migrateResult.details.map((d, i) => (
                      <li key={i} className="text-xs text-neutral-500">{d}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              بذر صلاحيات المدرسين
            </h2>
          </div>
          <p className="text-sm text-neutral-500">
            منح المدرسين الصلاحيات الافتراضية في Firestore. هذا يتيح للمدرسين
            رؤية صفحات الإدارة حسب صلاحياتهم.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            variant="primary"
            onClick={() => permissionsMutation.mutate()}
            disabled={permissionsMutation.isPending}
            className="self-start"
          >
            {permissionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {permissionsMutation.isPending ? "جارٍ البذر..." : "بدء البذر"}
          </Button>

          {permissionsMutation.isError && (
            <ErrorState
              title="فشلت العملية"
              description={permissionsMutation.error?.message ?? "حدث خطأ غير متوقع"}
            />
          )}

          {permResult && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 className="mb-2 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                النتيجة
              </h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  تم البذر: {permResult.updated}
                </Badge>
                <Badge variant="secondary">
                  موجود مسبقاً: {permResult.skipped}
                </Badge>
                {permResult.errors > 0 && (
                  <Badge variant="danger">
                    <AlertTriangle className="h-3 w-3" />
                    أخطاء: {permResult.errors}
                  </Badge>
                )}
              </div>
              {permResult.details.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700">
                    عرض التفاصيل ({permResult.details.length})
                  </summary>
                  <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {permResult.details.map((d, i) => (
                      <li key={i} className="text-xs text-neutral-500">{d}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="outline">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">ملاحظة مهمة</p>
              <p>
                أدوات الإعداد هذه تقوم بإنشاء وثائق المستخدمين والصلاحيات في Firestore.
                إذا كان المستخدم موجوداً مسبقاً، سيتم تخطيه.
                هذا الإجراء آمن ويمكن تشغيله عدة مرات دون حدوث ضرر.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
