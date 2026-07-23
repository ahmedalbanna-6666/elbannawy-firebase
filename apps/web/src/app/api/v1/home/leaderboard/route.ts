import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { HomeService } from '@el-bannawy/lib';

const homeService = new HomeService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);

    const result = await homeService.getLeaderboard(limit);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: { items: result.value } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
