import { NextRequest, NextResponse } from 'next/server';
import { TeacherRepository } from '@el-bannawy/lib';

const teacherRepo = new TeacherRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = (await request.json()) as { gradeIds?: string[]; academicYearId?: string };
    const gradeIds = body.gradeIds ?? [];
    const academicYearId = body.academicYearId ?? '';

    const results = [];
    for (const gradeId of gradeIds) {
      const assignmentId = `ta-${id}-${gradeId}`;
      const result = await teacherRepo.createAssignment({
        id: assignmentId,
        teacherId: id,
        gradeId,
        academicYearId,
      });
      if (!result.ok && result.error.code !== 'ALREADY_EXISTS') {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }
      if (result.ok) results.push(result.value);
    }

    return NextResponse.json({ success: true, data: { id, gradeIds, assignments: results } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Failed to assign grades',
        },
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const result = await teacherRepo.listTeacherAssignments(id, { limit: 100 });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      data: {
        gradeIds: result.value.items.map((a: { gradeId: string }) => a.gradeId),
        assignments: result.value.items,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Failed to list teacher grades',
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = (await request.json()) as { gradeIds?: string[] };
    const gradeIds = body.gradeIds ?? [];

    for (const gradeId of gradeIds) {
      const assignmentId = `ta-${id}-${gradeId}`;
      await teacherRepo.deactivateAssignment(assignmentId, `delete-${id}`);
    }

    return NextResponse.json({ success: true, data: { id, deactivatedGradeIds: gradeIds } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Failed to remove grades',
        },
      },
      { status: 500 },
    );
  }
}
