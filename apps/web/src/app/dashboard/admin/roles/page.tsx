"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { Shield, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PermissionInfo {
  permission: string;
  label: string;
}

interface RoleInfo {
  role: string;
  label: string;
  description: string;
  permissions: PermissionInfo[];
}

interface RolesData {
  roles: RoleInfo[];
  allPermissions: PermissionInfo[];
}

export default function AdminRolesPage(): ReactNode {
  const { data, isLoading, isError, error } = useQuery<RolesData>({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await api.get<RolesData>("/admin/roles");
      return res.data ?? { roles: [], allPermissions: [] };
    },
  });

  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) return <RolesSkeleton />;
  if (isError) return <ErrorState title="فشل التحميل" description={error instanceof Error ? error.message : "حدث خطأ"} />;

  const roles = data?.roles ?? [];
  const allPermissions = data?.allPermissions ?? [];

  const filteredPermissions = allPermissions.filter(
    (p) => !searchTerm || p.label.includes(searchTerm) || p.permission.includes(searchTerm),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">الأدوار والصلاحيات</h1>
        <p className="mt-1 text-sm text-neutral-500">عرض الأدوار والصلاحيات المتاحة في المنصة</p>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((role) => (
          <Card key={role.role} variant="elevated" padding="none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className={`h-5 w-5 ${role.role === "ADMINISTRATOR" ? "text-warning-500" : role.role === "TEACHER" ? "text-primary-500" : "text-neutral-500"}`} />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{role.label}</h3>
                <Badge variant="secondary">{role.role}</Badge>
              </div>
              <p className="text-xs text-neutral-500 mb-3">{role.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">{role.permissions.length} صلاحية</span>
                <button
                  className="text-xs text-primary-500 flex items-center gap-1"
                  onClick={() => { setExpandedRole(expandedRole === role.role ? null : role.role); }}
                >
                  {expandedRole === role.role ? "إخفاء" : "عرض الصلاحيات"}
                  {expandedRole === role.role ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expanded Permission Details */}
      {expandedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  صلاحيات: {roles.find((r) => r.role === expandedRole)?.label ?? expandedRole}
                </h2>
              </div>
              <Input
                placeholder="بحث في الصلاحيات..."
                className="max-w-xs"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredPermissions.length === 0 ? (
              <p className="text-sm text-neutral-500">لا توجد صلاحيات تطابق البحث</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredPermissions.map((p) => {
                  const roleHasIt = roles.find((r) => r.role === expandedRole)?.permissions.some((rp) => rp.permission === p.permission);
                  return (
                    <div
                      key={p.permission}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${
                        roleHasIt
                          ? "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
                          : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50 opacity-50"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${roleHasIt ? "bg-primary-500" : "bg-neutral-300"}`} />
                      <span className={roleHasIt ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500"}>{p.label}</span>
                      <span className="text-xs text-neutral-400 mr-auto">{p.permission}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Permissions Reference */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">جميع الصلاحيات</h2>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="بحث في جميع الصلاحيات..."
            className="max-w-xs mb-4"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
          />
          {filteredPermissions.length === 0 ? (
            <p className="text-sm text-neutral-500">لا توجد صلاحيات تطابق البحث</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredPermissions.map((p) => (
                <div key={p.permission} className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-2 text-sm">
                  <span className="text-neutral-900 dark:text-neutral-100">{p.label}</span>
                  <span className="text-xs text-neutral-400 mr-auto">{p.permission}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RolesSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  );
}
