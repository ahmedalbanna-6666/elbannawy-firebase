import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CompetitionRepository, UserService } from '@el-bannawy/lib';

const competitionRepo = new CompetitionRepository();
const userService = new UserService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const caller = await userService.getUserById(decoded.uid);
    if (!caller.ok) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } }, { status: 401 });
    }

    const filter: Record<string, unknown> = {};
    if (caller.value.role !== 'administrator') {
      filter.teacherId = decoded.uid;
    }

    const result = await competitionRepo.list(filter as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
