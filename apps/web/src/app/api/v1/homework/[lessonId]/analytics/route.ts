import { NextRequest, NextResponse } from 'next/server';
import { HomeworkService } from '@el-bannawy/lib';

const homeworkService = new HomeworkService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  const { lessonId } = await params;
  try {
    const homework = await homeworkService.getHomework(lessonId);
    if (!homework.ok || !homework.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Homework not found' } }, { status: 404 });
    }
    const hw = homework.value;
    return NextResponse.json({
      success: true,
      data: {
        id: hw.id,
        title: hw.title,
        passingScore: hw.passingScore,
        totalQuestions: 0,
        averageScore: 0,
        totalAttempts: 0,
        passRate: 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
