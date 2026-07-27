import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService, FinalReviewApplicationService } from "@el-bannawy/lib";
import { authenticateStudent, authenticateAdminOrTeacher, successResponse, handleRepoResult, handleRepoResultCreated, internalError, getRequestBody } from "@/lib/route-helpers";

const appService = new FinalReviewApplicationService(new FinalReviewService());

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const student = await authenticateStudent(request);
    if (student) {
      if (!student.gradeId) return successResponse({ items: [], nextCursor: null });
      return handleRepoResult(await appService.list({ gradeId: student.gradeId, published: true, enabled: true }));
    }
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};
    if (searchParams.get("gradeId")) filter.gradeId = searchParams.get("gradeId");
    if (searchParams.get("published") !== null) filter.published = searchParams.get("published") === "true";
    if (searchParams.get("enabled") !== null) filter.enabled = searchParams.get("enabled") === "true";
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
    const cursor = searchParams.get("cursor") ?? undefined;
    return handleRepoResult(await appService.list(filter, { limit, cursor }));
  } catch (error) { return internalError(error); }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    return handleRepoResultCreated(await appService.create(body));
  } catch (error) { return internalError(error); }
}
