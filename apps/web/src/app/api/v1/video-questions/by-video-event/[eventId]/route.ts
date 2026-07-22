import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('videoQuestions').where('eventId', '==', eventId).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ success: true, data: null });
    }
    const doc = snapshot.docs[0]!;
    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}
