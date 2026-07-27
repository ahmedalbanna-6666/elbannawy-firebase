import { NextRequest, NextResponse } from "next/server";
import { StoryService } from "@el-bannawy/lib";
import { authenticateRequest } from "@/lib/firebase/auth-helper";
import { handleRepoResult, internalError, unauthorized } from "@/lib/route-helpers";

const storyService = new StoryService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) return unauthorized();
    const { id: storyId } = await params;
    return handleRepoResult(await storyService.getProgress(decoded.uid, storyId));
  } catch (error) { return internalError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) return unauthorized();
    const body: Record<string, unknown> = await request.json() as Record<string, unknown>;
    const { id: storyId } = await params;
    const result = await storyService.upsertProgress({
      id: (body.id as string) ?? crypto.randomUUID(),
      studentId: decoded.uid,
      storyId,
      status: (body.status as import("@el-bannawy/lib").IStoryProgress["status"]) ?? "in_progress",
      progressPercent: (body.progressPercent as number) ?? 0,
      lastActiveAt: new Date().toISOString(),
      contentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return handleRepoResult(result);
  } catch (error) { return internalError(error); }
}
