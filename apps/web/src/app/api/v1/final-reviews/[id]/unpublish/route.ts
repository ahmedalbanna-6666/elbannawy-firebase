import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService, FinalReviewApplicationService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, internalError } from "@/lib/route-helpers";

const appService = new FinalReviewApplicationService(new FinalReviewService());

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(_request);
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    return handleRepoResult(await appService.update(id, { published: false }));
  } catch (error) { return internalError(error); }
}
