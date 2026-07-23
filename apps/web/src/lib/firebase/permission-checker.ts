import "server-only";
import { getAdminDb } from "./admin";

export async function userHasPermission(uid: string, permission: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const permDoc = await db.collection('userPermissions').doc(uid).get();
    if (!permDoc.exists) return false;
    const data = permDoc.data() as { permissions?: string[] } | undefined;
    return data?.permissions?.includes(permission) ?? false;
  } catch {
    return false;
  }
}

export async function userCanAnswerSupport(uid: string, role: string): Promise<boolean> {
  if (role === 'support' || role === 'administrator') return true;
  return userHasPermission(uid, 'support.answer');
}
