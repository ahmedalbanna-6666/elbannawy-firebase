import { NextRequest, NextResponse } from "next/server";
import { StoryService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, internalError, getRequestBody } from "@/lib/route-helpers";

const storyService = new StoryService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; chapterId: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    const { chapterId } = await params;
    return handleRepoResult(await storyService.updateChapter(chapterId, body));
  } catch (error) { return internalError(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; chapterId: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const { chapterId } = await params;
    const result = await storyService.deleteChapter(chapterId);
    return result.ok ? NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() }) : NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: 500 });
  } catch (error) { return internalError(error); }
}
