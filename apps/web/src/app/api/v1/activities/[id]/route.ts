import { NextRequest, NextResponse } from 'next/server';
import { ActivityService, ActivityRepository, StudentAttemptRepository, LessonProgressRepository } from '@el-bannawy/lib';
const service = new ActivityService(
  new ActivityRepository(),
  new StudentAttemptRepository(),
  new LessonProgressRepository(),
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await service.getActivity(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await service.updateActivity(id, body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const result = await service.deleteActivity(id, requestId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
