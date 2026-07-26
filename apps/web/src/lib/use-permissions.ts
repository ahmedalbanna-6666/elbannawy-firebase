import { useAuthStore } from "@/lib/auth-store";
import {
  getPermissionsForRole,
  type UserRole,
  type Permission,
} from "@el-bannawy/shared";

export function usePermissions(): {
  readonly role: UserRole;
  readonly permissions: readonly Permission[];
  readonly can: (permission: Permission) => boolean;
  readonly canAny: (...permissions: Permission[]) => boolean;
  readonly canAll: (...permissions: Permission[]) => boolean;
  readonly isAdmin: boolean;
  readonly isTeacher: boolean;
  readonly isStaff: boolean;
  readonly isStudent: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role;
  const aliasMap: Record<string, UserRole> = { ADMIN: "ADMINISTRATOR" };
  const normalizedRole: UserRole | undefined = userRole
    ? (aliasMap[userRole.toUpperCase()] ?? userRole.toUpperCase() as UserRole)
    : undefined;

  const role = normalizedRole ?? "STUDENT";

  const rolePermissions = getPermissionsForRole(role);
  const effectivePermissions: readonly Permission[] | undefined = Array.isArray(user?.effectivePermissions) ? user?.effectivePermissions : undefined;
  const mergedPermissions: readonly Permission[] = effectivePermissions !== undefined
    ? [...new Set([...rolePermissions, ...effectivePermissions])]
    : rolePermissions;

  return {
    role,
    permissions: mergedPermissions,
    can: (permission: Permission): boolean => mergedPermissions.includes(permission),
    canAny: (...permissionList: Permission[]): boolean => permissionList.some((p) => mergedPermissions.includes(p)),
    canAll: (...permissionList: Permission[]): boolean => permissionList.every((p) => mergedPermissions.includes(p)),
    isAdmin: role === "ADMINISTRATOR",
    isTeacher: role === "TEACHER",
    isStaff: role === "STAFF",
    isStudent: role === "STUDENT",
  };
}
