import { NextRequest, NextResponse } from 'next/server';
import { TeacherService } from '@el-bannawy/lib';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const teacherService = new TeacherService();
    const result = await teacherService.getMyGrades(decoded.uid);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    );
  }
}
