import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith('/history')) {
    return NextResponse.json({ success: true, data: { items: [], total: 0 } }, { status: 200 });
  }
  return NextResponse.json({ success: true, data: null }, { status: 200 });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ success: true, data: { id: 'stub', questions: [] } }, { status: 201 });
}
