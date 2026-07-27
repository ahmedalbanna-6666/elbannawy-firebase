import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { ActivityRepository } from '@el-bannawy/lib';

const activityRepository = new ActivityRepository();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      title?: string;
      type?: string;
      options?: { text: string; isCorrect: boolean; displayOrder?: number }[];
      timestamp?: number;
    };

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;

    if (body.options) {
      updateData.config = {
        schemaVersion: 1,
        data: {
          questionType: 'video',
          options: body.options.map((opt, idx) => ({
            id: `opt_${id}_${idx}`,
            text: opt.text,
            isCorrect: opt.isCorrect,
            displayOrder: opt.displayOrder ?? idx,
          })),
        },
      };
    }

    const activityResult = await activityRepository.updateActivity(id, updateData as any, 0);
    if (!activityResult.ok) {
      return NextResponse.json({ success: false, error: activityResult.error }, { status: 500 });
    }

    const activity = activityResult.value;
    const configData = activity.config?.data as {
      options?: { id: string; text: string; isCorrect: boolean }[];
    } | undefined;

    return NextResponse.json({
      success: true,
      data: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        options: (configData?.options ?? []).map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to update question' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const softDeleteResult = await activityRepository.softDeleteActivity(id, `del_${Date.now()}`);
    if (!softDeleteResult.ok) {
      return NextResponse.json({ success: false, error: softDeleteResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to delete question' } }, { status: 500 });
  }
}
