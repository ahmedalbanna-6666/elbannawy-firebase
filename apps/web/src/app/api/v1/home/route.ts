import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { HomeService } from '@el-bannawy/lib';

const homeService = new HomeService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);

    const result = await homeService.getDashboard(decoded.uid);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
