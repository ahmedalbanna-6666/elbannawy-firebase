import { NextRequest, NextResponse } from 'next/server';
import { LessonProgressRepository } from '@el-bannawy/lib';

const progressRepo = new LessonProgressRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: studentId } = await params;
  try {
    const result = await progressRepo.listStudentProgress(studentId);
    if (!result.ok) return NextResponse.json({ success: true, data: { progress: [], completedLessons: 0, totalLessons: 0 } });
    return NextResponse.json({
      success: true,
      data: {
        progress: result.value,
        completedLessons: result.value.filter(p => p.status === 'completed').length,
        totalLessons: result.value.length,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch progress' } }, { status: 500 });
  }
}
