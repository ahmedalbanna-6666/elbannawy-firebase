import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  if (!videoId) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'videoId is required' } }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('videoEvents').where('videoId', '==', videoId).orderBy('timeSeconds', 'asc').get();
    const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data: events });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
