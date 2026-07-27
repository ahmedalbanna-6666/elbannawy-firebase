import { NextRequest, NextResponse } from "next/server";
import { StoryService, StoryApplicationService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, internalError, getRequestBody } from "@/lib/route-helpers";

const appService = new StoryApplicationService(new StoryService());

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await params;
    return handleRepoResult(await appService.getById(id));
  } catch (error) { return internalError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    const expectedVersion = Number(body._expectedVersion) || 0;
    delete body._expectedVersion;
    const { id } = await params;
    return handleRepoResult(await appService.update(id, body, expectedVersion));
  } catch (error) { return internalError(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const { id } = await params;
    const result = await appService.softDelete(id, `delete-${id}-${Date.now()}`);
    return result.ok ? NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() }) : NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: 500 });
  } catch (error) { return internalError(error); }
}
