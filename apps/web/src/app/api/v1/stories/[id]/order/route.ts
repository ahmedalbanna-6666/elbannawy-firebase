import { NextRequest, NextResponse } from "next/server";
import { StoryService, StoryApplicationService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, internalError } from "@/lib/route-helpers";

const appService = new StoryApplicationService(new StoryService());

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    let body: { order?: number };
    try { body = await request.json() as { order?: number }; } catch { return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Invalid JSON body" }, timestamp: new Date().toISOString() }, { status: 400 }); }
    if (body.order === undefined || typeof body.order !== "number" || body.order < 0 || !Number.isInteger(body.order)) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "order must be a non-negative integer" }, timestamp: new Date().toISOString() }, { status: 400 });
    }
    const { id } = await params;
    return handleRepoResult(await appService.update(id, { displayOrder: body.order }));
  } catch (error) { return internalError(error); }
}
