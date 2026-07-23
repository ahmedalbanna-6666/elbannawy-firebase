import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ success: true, data: [] }, { status: 200 });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ success: true, data: { id: 'stub', messages: [] } }, { status: 201 });
}
