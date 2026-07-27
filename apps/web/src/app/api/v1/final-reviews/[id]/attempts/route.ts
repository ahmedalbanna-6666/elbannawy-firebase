import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService } from "@el-bannawy/lib";
import { authenticateRequest } from "@/lib/firebase/auth-helper";
import { handleRepoResult, handleRepoResultCreated, internalError, unauthorized, getRequestBody } from "@/lib/route-helpers";

const reviewService = new FinalReviewService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) return unauthorized();
    const { id: finalReviewId } = await params;
    return handleRepoResult(await reviewService.listAttempts(decoded.uid, finalReviewId));
  } catch (error) { return internalError(error); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) return unauthorized();
    const { id: finalReviewId } = await params;
    const existingResult = await reviewService.listAttempts(decoded.uid, finalReviewId);
    if (!existingResult.ok) return NextResponse.json({ success: false, error: existingResult.error, timestamp: new Date().toISOString() }, { status: 500 });
    const attemptNumber = existingResult.value.length + 1;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    const attemptId = crypto.randomUUID();
    return handleRepoResultCreated(await reviewService.createAttempt({
      id: attemptId,
      studentId: decoded.uid,
      finalReviewId,
      attemptNumber,
      status: "in_progress",
      maxScore: (body.maxScore as number) ?? 0,
      startedAt: new Date().toISOString(),
      contentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) { return internalError(error); }
}
