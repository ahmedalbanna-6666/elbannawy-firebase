import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService, FinalReviewApplicationService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, internalError } from "@/lib/route-helpers";

const appService = new FinalReviewApplicationService(new FinalReviewService());

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};
    if (searchParams.get("gradeId")) filter.gradeId = searchParams.get("gradeId");
    if (searchParams.get("published") !== null) filter.published = searchParams.get("published") === "true";
    if (searchParams.get("enabled") !== null) filter.enabled = searchParams.get("enabled") === "true";
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
    const cursor = searchParams.get("cursor") ?? undefined;
    return handleRepoResult(await appService.list(filter, { limit, cursor }));
  } catch (error) { return internalError(error); }
}
