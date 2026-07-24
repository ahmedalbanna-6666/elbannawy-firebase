import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "./admin";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

export interface AuthUser {
  uid: string;
  email?: string;
  role?: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  let token = request.cookies.get("auth_token")?.value;
  const authHeader = request.headers.get("Authorization");
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  if (!token) return null;

  const adminAuth = getAdminAuth();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email, role: decoded.role as string | undefined };
  } catch {}

  // Fallback: Identity Toolkit lookup API
  try {
    const https = await import("https");
    const result = await new Promise<{ ok: boolean; data: unknown }>((resolve) => {
      const req = https.request(
        {
          hostname: "identitytoolkit.googleapis.com",
          path: "/v1/accounts:lookup?key=" + FIREBASE_API_KEY,
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => {
            try {
              resolve({ ok: res.statusCode === 200, data: JSON.parse(d) });
            } catch {
              resolve({ ok: false, data: d });
            }
          });
        }
      );
      req.on("error", (e) => resolve({ ok: false, data: e.message }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, data: { error: { message: "Timed out" } } }); });
      req.write(JSON.stringify({ idToken: token }));
      req.end();
    });
    if (result.ok) {
      const lookupData = result.data as { users?: Array<{ localId: string; email?: string }> };
      const userInfo = lookupData.users?.[0];
      if (userInfo) {
        try {
          const userRecord = await getAdminAuth().getUser(userInfo.localId);
          return { uid: userInfo.localId, email: userInfo.email, role: (userRecord.customClaims as Record<string, string> | null)?.role };
        } catch {
          return { uid: userInfo.localId, email: userInfo.email };
        }
      }
    }
  } catch {}

  return null;
}

const ADMIN_ROLES = new Set(['admin', 'administrator', 'ADMINISTRATOR']);

export function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.has(role.toLowerCase());
}

export type AuthResult = { authorized: true; user: AuthUser } | { authorized: false; response: NextResponse };

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const decoded = await authenticateRequest(request);
  if (!decoded) {
    return { authorized: false, response: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 }) };
  }
  if (!isAdminRole(decoded.role)) {
    return { authorized: false, response: NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 }) };
  }
  return { authorized: true, user: decoded };
}

export function normalizeRole(role: string): string {
  const normalized = role.toLowerCase().trim();
  if (normalized === 'admin' || normalized === 'administrator') return 'administrator';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'staff') return 'staff';
  if (normalized === 'secretary') return 'secretary';
  if (normalized === 'support') return 'support';
  if (normalized === 'student') return 'student';
  return 'student';
}
