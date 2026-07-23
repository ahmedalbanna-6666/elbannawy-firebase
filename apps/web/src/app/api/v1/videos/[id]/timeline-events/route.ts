import { NextRequest, NextResponse } from 'next/server';
import { TimelineEventRepository } from '@el-bannawy/lib';

const eventRepository = new TimelineEventRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const result = await eventRepository.listByVideo(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: { items: result.value } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 },
    );
  }
}
