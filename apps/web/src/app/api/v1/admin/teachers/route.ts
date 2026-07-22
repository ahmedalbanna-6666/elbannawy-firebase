import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@el-bannawy/lib';

const userRepo = new UserRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = { role: ['teacher'] };
  if (status) filter.isActive = status === 'active';
  if (search) filter.search = search;

  try {
    const result = await userRepo.listUsers(filter, { limit, cursor });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list teachers' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = await userRepo.createUser({
      id: body.id as string ?? 'teacher-' + String(Date.now()),
      role: 'teacher',
      fullName: body.fullName as string,
      mobileNumber: body.mobileNumber as string,
      isActive: true,
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create teacher' } }, { status: 500 });
  }
}
