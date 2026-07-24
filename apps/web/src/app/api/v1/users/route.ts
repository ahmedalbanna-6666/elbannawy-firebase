import { NextRequest, NextResponse } from 'next/server';
import { UserService, UserApplicationService, CreateUserInputSchema, UserFilterSchema, PageQuerySchema } from '@el-bannawy/lib';
import { requireAdmin } from '@/lib/firebase/auth-helper';

const userService = new UserService();
const applicationService = new UserApplicationService(userService);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const roleParam = searchParams.get('role');
  const isActiveParam = searchParams.get('isActive');
  const gradeId = searchParams.get('gradeId');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = {};
  if (roleParam) filter.role = roleParam.split(',');
  if (isActiveParam !== null) filter.isActive = isActiveParam === 'true';
  if (gradeId) filter.gradeId = gradeId;
  if (search) filter.search = search;

  const page: Record<string, unknown> = { limit };
  if (cursor) page.cursor = cursor;

  const parsedFilter = UserFilterSchema.safeParse(filter);
  if (!parsedFilter.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: parsedFilter.error.message },
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  const parsedPage = PageQuerySchema.safeParse(page);
  if (!parsedPage.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: parsedPage.error.message },
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  const result = await userService.listUsers(parsedFilter.data, parsedPage.data);

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
      data: {
        items: result.value.items,
        nextCursor: result.value.nextCursor,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

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

  const parsed = CreateUserInputSchema.safeParse(body);
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

  const result = await applicationService.createUser(parsed.data);

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
      data: result.value,
      timestamp: new Date().toISOString(),
    },
    { status: 201 },
  );
}

function mapErrorCode(code: string): number {
  switch (code) {
    case 'INVALID_INPUT':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'ALREADY_EXISTS':
      return 409;
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
