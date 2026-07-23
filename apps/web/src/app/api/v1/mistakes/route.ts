import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ success: true, data: { items: [], total: 0 } }, { status: 200 });
}
