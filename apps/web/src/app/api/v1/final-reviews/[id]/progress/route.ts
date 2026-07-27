import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService } from "@el-bannawy/lib";
import { authenticateRequest } from "@/lib/firebase/auth-helper";
import { handleRepoResult, internalError, unauthorized } from "@/lib/route-helpers";

const reviewService = new FinalReviewService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) return unauthorized();
    const { id: finalReviewId } = await params;
    return handleRepoResult(await reviewService.getProgress(decoded.uid, finalReviewId));
  } catch (error) { return internalError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) return unauthorized();
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Invalid JSON body" }, timestamp: new Date().toISOString() }, { status: 400 }); }
    const { id: finalReviewId } = await params;
    const result = await reviewService.upsertProgress({
      id: (body.id as string) ?? crypto.randomUUID(),
      studentId: decoded.uid,
      finalReviewId,
      progressPercent: (body.progressPercent as number) ?? 0,
      readiness: (body.readiness as string) ?? undefined,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return handleRepoResult(result);
  } catch (error) { return internalError(error); }
}
