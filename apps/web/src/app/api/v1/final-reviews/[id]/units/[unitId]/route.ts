import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, internalError, getRequestBody } from "@/lib/route-helpers";

const reviewService = new FinalReviewService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; unitId: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    const { unitId } = await params;
    return handleRepoResult(await reviewService.updateUnit(unitId, body));
  } catch (error) { return internalError(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; unitId: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const { unitId } = await params;
    const result = await reviewService.deleteUnit(unitId);
    return result.ok ? NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() }) : NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: 500 });
  } catch (error) { return internalError(error); }
}
