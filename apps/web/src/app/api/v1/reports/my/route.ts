import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { ReportRepository } from '@el-bannawy/lib';

const reportRepo = new ReportRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodStart = searchParams.get('periodStart') || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
    const periodEnd = searchParams.get('periodEnd') || new Date().toISOString();

    const result = await reportRepo.generateReport(decoded.uid, 'CUSTOM', periodStart, periodEnd);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
