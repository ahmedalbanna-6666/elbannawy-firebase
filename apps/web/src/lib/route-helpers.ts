import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "./firebase/admin";
import { authenticateRequest, normalizeRole } from "./firebase/auth-helper";
import type { RepositoryResult } from "@el-bannawy/lib";

export function mapErrorCode(code: string): number {
  switch (code) {
    case "INVALID_INPUT": return 400;
    case "NOT_FOUND": return 404;
    case "ALREADY_EXISTS": return 409;
    case "CONFLICT": return 409;
    case "FORBIDDEN": return 403;
    case "PRECONDITION_FAILED": return 412;
    case "RATE_LIMITED": return 429;
    case "UNAVAILABLE": return 503;
    default: return 500;
  }
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data: data as T, timestamp: new Date().toISOString() }, { status });
}

export function successResponseCreated<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data: data as T, timestamp: new Date().toISOString() }, { status: 201 });
}

export function errorResponse(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: { code, message }, timestamp: new Date().toISOString() }, { status });
}

export function unauthorized(): NextResponse {
  return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
}

export function forbidden(msg = "Insufficient permissions"): NextResponse {
  return errorResponse("FORBIDDEN", msg, 403);
}

export function notFound(entity = "Resource"): NextResponse {
  return errorResponse("NOT_FOUND", `${entity} not found`, 404);
}

export function invalidInput(message = "Invalid JSON body"): NextResponse {
  return errorResponse("INVALID_INPUT", message, 400);
}

export function internalError(error: unknown): NextResponse {
  return errorResponse("INTERNAL", error instanceof Error ? error.message : "Unknown error", 500);
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: string;
  gradeId?: string;
}

export async function authenticateAdminOrTeacher(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const decoded = await authenticateRequest(request);
  if (!decoded) return unauthorized();
  const db = getAdminDb();
  try {
    const userSnap = await db.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) return forbidden();
    const data = userSnap.data();
    const roleVal = (data as Record<string, unknown>)?.role;
    let rawRole = "";
    if (typeof roleVal === "string") rawRole = roleVal;
    else if (roleVal && typeof roleVal === "object") rawRole = (roleVal as Record<string, unknown>).role as string || "";
    if (!rawRole) return forbidden();
    const normalized = normalizeRole(rawRole);
    if (normalized !== "administrator" && normalized !== "teacher") return forbidden();
    return { uid: decoded.uid, role: normalized, gradeId: (data as Record<string, unknown>)?.gradeId as string | undefined };
  } catch {
    return internalError("Failed to verify permissions");
  }
}

export async function authenticateStudent(request: NextRequest): Promise<AuthenticatedUser | null> {
  const decoded = await authenticateRequest(request);
  if (!decoded) return null;
  try {
    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(decoded.uid).get();
    const gradeId = userSnap.exists ? (userSnap.data() as Record<string, unknown> | undefined)?.gradeId as string | undefined : undefined;
    return { uid: decoded.uid, role: "student", gradeId };
  } catch {
    return { uid: decoded.uid, role: "student" };
  }
}

export async function getRequestBody<T = Record<string, unknown>>(request: NextRequest): Promise<T | NextResponse> {
  try {
    return await request.json() as T;
  } catch {
    return invalidInput("Invalid JSON body") as unknown as T;
  }
}

export function handleRepoResult<T>(result: RepositoryResult<T>): NextResponse {
  if (result.ok) return successResponse(result.value);
  return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
}

export function handleRepoResultCreated<T>(result: RepositoryResult<T>): NextResponse {
  if (result.ok) return successResponseCreated(result.value);
  return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
}

export function parsePaginationParams(searchParams: URLSearchParams): { limit: number; cursor?: string } {
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  return { limit, cursor };
}
