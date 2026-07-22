import { NextRequest, NextResponse } from 'next/server';
import { UserService, UserApplicationService, ChangeStatusInputSchema } from '@el-bannawy/lib';

const userService = new UserService();
const applicationService = new UserApplicationService(userService);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  const requestId = body._requestId as string || `status-${id}-${Date.now()}`;
  const input = { ...body, requestId };

  const parsed = ChangeStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message },
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  const result = await applicationService.changeStatus(id, input);

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
