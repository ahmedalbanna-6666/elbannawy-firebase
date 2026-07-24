import { NextRequest, NextResponse } from 'next/server';
import { UserService, UserApplicationService } from '@el-bannawy/lib';
import { requireAdmin } from '@/lib/firebase/auth-helper';
import { getAdminAuth } from '@/lib/firebase/admin';

const userService = new UserService();
const applicationService = new UserApplicationService(userService);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const requestId = `restore-${id}-${Date.now()}`;

  const result = await applicationService.restoreUser(id, requestId);

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      },
      { status: mapErrorCode(result.error.code) },
    );
  }

  try {
    await getAdminAuth().updateUser(id, { disabled: false });
  } catch {
    // Firebase Auth user may not exist
  }

  return NextResponse.json(
    {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

function mapErrorCode(code: string): number {
  switch (code) {
    case 'INVALID_INPUT':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
    case 'FORBIDDEN':
      return 403;
    case 'PRECONDITION_FAILED':
      return 412;
    case 'RATE_LIMITED':
      return 429;
    case 'UNAVAILABLE':
      return 503;
    default:
      return 500;
  }
}
