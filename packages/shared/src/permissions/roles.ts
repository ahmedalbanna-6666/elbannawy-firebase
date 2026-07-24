import { PERMISSIONS, type Permission } from "./permissions";

export type UserRole = "ADMINISTRATOR" | "TEACHER" | "STAFF" | "STUDENT";

const { PERMISSIONS: P } = { PERMISSIONS };

const ALL = Object.values(PERMISSIONS);

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMINISTRATOR: ALL,

  TEACHER: [
    P.UNITS_VIEW, P.UNITS_CREATE, P.UNITS_EDIT,
    P.LESSONS_VIEW, P.LESSONS_CREATE, P.LESSONS_EDIT,
    P.VIDEOS_UPLOAD, P.PDFS_UPLOAD,
    P.VOCABULARY_MANAGE, P.HOMEWORK_MANAGE, P.QUIZZES_MANAGE,
    P.FINAL_REVIEW_VIEW, P.FINAL_REVIEW_EDIT,
    P.STORY_VIEW, P.STORY_EDIT, P.STORY_PUBLISH,
    P.LIVE_VIEW, P.LIVE_CREATE, P.LIVE_EDIT, P.LIVE_DELETE, P.LIVE_CONTROL,
    P.REPORTS_VIEW, P.REPORTS_EXPORT,
    P.NOTIFICATIONS_SEND,
    P.AI_MANAGE,
    P.LEARNING_ACCESS,
    P.COINS_VIEW, P.COINS_GRANT, P.COINS_UNLOCK,
    P.MISTAKES_VIEW, P.MISTAKES_PRACTICE,
    P.COMPETITION_MANAGE, P.COMPETITION_VIEW,
    P.SUPPORT_ANSWER,
  ],

  STAFF: [
    P.SUPPORT_ANSWER,
    P.PDFS_UPLOAD,
    P.VIDEOS_UPLOAD,
    P.NOTIFICATIONS_SEND,
    P.LESSONS_VIEW, P.LESSONS_EDIT,
    P.UNITS_VIEW,
    P.STORY_VIEW,
    P.FINAL_REVIEW_VIEW,
    P.LIVE_VIEW,
    P.REPORTS_VIEW,
    P.LEARNING_ACCESS,
    P.COINS_VIEW,
  ],

  STUDENT: [
    P.LEARNING_ACCESS,
    P.UNITS_VIEW,
    P.LESSONS_VIEW,
    P.STORY_VIEW,
    P.FINAL_REVIEW_VIEW,
    P.LIVE_VIEW,
    P.AI_MANAGE,
    P.COINS_VIEW, P.COINS_PURCHASE, P.COINS_UNLOCK,
    P.MISTAKES_VIEW, P.MISTAKES_PRACTICE,
    P.COMPETITION_VIEW,
  ],
};

export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = getPermissionsForRole(role);
  return perms.length > 0 && perms.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const perms = getPermissionsForRole(role);
  return perms.length > 0 && permissions.some((p) => perms.includes(p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const perms = getPermissionsForRole(role);
  return perms.length > 0 && permissions.every((p) => perms.includes(p));
}
