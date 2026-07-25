import { NextRequest, NextResponse } from 'next/server';
import { TeacherRepository } from '@el-bannawy/lib';
import { requireAdmin } from '@/lib/firebase/auth-helper';

const teacherRepo = new TeacherRepository();

async function checkAdmin(request: NextRequest): Promise<{ authorized: false; response: NextResponse } | null> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return { authorized: false, response: auth.response };
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const unauth = await checkAdmin(request);
  if (unauth) return unauth.response;
  const { id } = await params;
  try {
    const body = (await request.json()) as { gradeIds?: string[]; academicYearId?: string };
    const newGradeIds = body.gradeIds ?? [];
    const academicYearId = body.academicYearId ?? '';

    const existingResult = await teacherRepo.listTeacherAssignments(id, { limit: 100 });
    const existingIds = existingResult.ok
      ? existingResult.value.items.map((a: { gradeId: string }) => a.gradeId)
      : [];

    const toAdd = newGradeIds.filter((gid: string) => !existingIds.includes(gid));
    const toRemove = existingIds.filter((gid: string) => !newGradeIds.includes(gid));

    const results = [];
    for (const gradeId of toAdd) {
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

    for (const gradeId of toRemove) {
      const assignmentId = `ta-${id}-${gradeId}`;
      await teacherRepo.deactivateAssignment(assignmentId, `update-${id}`);
    }

    return NextResponse.json({ success: true, data: { id, gradeIds: newGradeIds, added: results.length, removed: toRemove.length } });
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
  const unauth = await checkAdmin(request);
  if (unauth) return unauth.response;
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
  const unauth = await checkAdmin(request);
  if (unauth) return unauth.response;
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
