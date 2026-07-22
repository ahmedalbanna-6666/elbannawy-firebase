import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@el-bannawy/lib';

const userRepo = new UserRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const gradeId = searchParams.get('gradeId');

  const filter: Record<string, unknown> = { role: ['student'] };
  if (status) filter.isActive = status === 'active';
  if (search) filter.search = search;
  if (gradeId) filter.gradeId = gradeId;

  try {
    const result = await userRepo.listUsers(filter, { limit, cursor });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to list students' } }, { status: 500 });
  }
}
