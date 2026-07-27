import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, handleRepoResultCreated, internalError, getRequestBody } from "@/lib/route-helpers";

const reviewService = new FinalReviewService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id: finalReviewId } = await params;
    return handleRepoResult(await reviewService.listUnits(finalReviewId));
  } catch (error) { return internalError(error); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    const { id: finalReviewId } = await params;
    const unitId = crypto.randomUUID();
    return handleRepoResultCreated(await reviewService.createUnit({ ...body, id: unitId, finalReviewId } as Record<string, unknown>));
  } catch (error) { return internalError(error); }
}
