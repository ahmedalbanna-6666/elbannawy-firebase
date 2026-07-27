import { NextRequest, NextResponse } from "next/server";
import { StoryService } from "@el-bannawy/lib";
import { authenticateAdminOrTeacher, handleRepoResult, handleRepoResultCreated, internalError, getRequestBody } from "@/lib/route-helpers";

const storyService = new StoryService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id: storyId } = await params;
    return handleRepoResult(await storyService.listChapters(storyId));
  } catch (error) { return internalError(error); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const admin = await authenticateAdminOrTeacher(request);
    if (admin instanceof NextResponse) return admin;
    const body = await getRequestBody<Record<string, unknown>>(request);
    if (body instanceof NextResponse) return body;
    const { id: storyId } = await params;
    const chapterId = crypto.randomUUID();
    return handleRepoResultCreated(await storyService.createChapter({ ...body, id: chapterId, storyId } as Record<string, unknown>));
  } catch (error) { return internalError(error); }
}
