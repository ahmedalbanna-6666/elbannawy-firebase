import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService } from "@el-bannawy/lib";
import { handleRepoResult, internalError } from "@/lib/route-helpers";

const reviewService = new FinalReviewService();

export async function GET(_request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(_request.url);
    const unitId = searchParams.get("unitId");
    if (!unitId) return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "unitId query parameter is required" }, timestamp: new Date().toISOString() }, { status: 400 });
    const examParam = searchParams.get("exam");
    const exam = examParam !== null ? examParam === "true" : undefined;
    return handleRepoResult(await reviewService.listQuestions(unitId, exam));
  } catch (error) { return internalError(error); }
}
