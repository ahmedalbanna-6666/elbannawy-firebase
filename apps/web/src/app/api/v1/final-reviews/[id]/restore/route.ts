import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService, FinalReviewApplicationService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, internalError } from "@/lib/route-helpers";

const appService = new FinalReviewApplicationService(new FinalReviewService());

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(_request);
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    const requestId = `restore-${id}-${Date.now()}`;
    const result = await appService.restore(id, requestId);
    return result.ok ? NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() }) : NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: 500 });
  } catch (error) { return internalError(error); }
}
