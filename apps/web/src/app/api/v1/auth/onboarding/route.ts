import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { UserService } from '@el-bannawy/lib';

const userService = new UserService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: { educationalSystemId?: string; stageId?: string; gradeId?: string; academicYearId?: string; termId?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    if (!body.gradeId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'gradeId is required' } }, { status: 400 });
    }

    const result = await userService.updateAcademicAssignment(decoded.uid, {
      educationalSystemId: body.educationalSystemId,
      stageId: body.stageId,
      gradeId: body.gradeId,
      academicYearId: body.academicYearId,
      termId: body.termId,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { completed: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
