import { NextRequest, NextResponse } from 'next/server';
import { LessonVideoRepository } from '@el-bannawy/lib';

const videoRepository = new LessonVideoRepository();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> },
): Promise<NextResponse> {
  const { videoId } = await params;
  try {
    const result = await videoRepository.delete(videoId);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, data: null, timestamp: new Date().toISOString() },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
