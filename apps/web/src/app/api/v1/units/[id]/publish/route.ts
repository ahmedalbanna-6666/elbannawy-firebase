import { NextRequest, NextResponse } from 'next/server';
import { UnitService, UnitApplicationService } from '@el-bannawy/lib';

const unitService = new UnitService();
const applicationService = new UnitApplicationService(unitService);

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const result = await applicationService.updateUnit(id, { published: true }, 0);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: true, data: result.value, timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
