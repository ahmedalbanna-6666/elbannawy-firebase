import "server-only";
import { type NextRequest } from "next/server";
import { getAdminAuth } from "./admin";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

export async function authenticateRequest(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  let token = request.cookies.get("auth_token")?.value;
  const authHeader = request.headers.get("Authorization");
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  if (!token) return null;

  // Try Admin SDK verifyIdToken first
  const adminAuth = getAdminAuth();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
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
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ ok: false, data: { error: { message: "Timed out" } } });
      });
      req.write(JSON.stringify({ idToken: token }));
      req.end();
    });
    if (result.ok) {
      const lookupData = result.data as { users?: Array<{ localId: string; email?: string }> };
      const userInfo = lookupData.users?.[0];
      if (userInfo) return { uid: userInfo.localId, email: userInfo.email };
    }
  } catch {}

  return null;
}
