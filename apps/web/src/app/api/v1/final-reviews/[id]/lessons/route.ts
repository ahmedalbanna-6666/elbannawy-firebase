import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, handleRepoResultCreated, internalError, getRequestBody } from "@/lib/route-helpers";

const reviewService = new FinalReviewService();

export async function GET(_request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(_request.url);
    const unitId = searchParams.get("unitId");
    if (!unitId) return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "unitId query parameter is required" }, timestamp: new Date().toISOString() }, { status: 400 });
    return handleRepoResult(await reviewService.listLessons(unitId));
  } catch (error) { return internalError(error); }
}

export async function POST(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    const lessonId = crypto.randomUUID();
    return handleRepoResultCreated(await reviewService.createLesson({ ...body, id: lessonId } as Record<string, unknown>));
  } catch (error) { return internalError(error); }
}
