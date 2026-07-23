import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);

    const db = getAdminDb();

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() as Record<string, unknown> : {};
    const gradeId = userData.gradeId as string | undefined;

    let query = db.collection('stories').where('published', '==', true);
    if (gradeId) query = query.where('gradeId', '==', gradeId);
    const snapshot = await query.orderBy('displayOrder', 'asc').get();

    const storiesList: Array<Record<string, unknown>> = [];
    for (const doc of snapshot.docs) {
      const storyData = doc.data() as Record<string, unknown>;
      const chaptersSnap = await db.collection('storyChapters')
        .where('storyId', '==', doc.id)
        .where('published', '==', true)
        .orderBy('displayOrder', 'asc')
        .get();
      const chapters = chaptersSnap.docs.map((c) => {
        const cd = c.data() as Record<string, unknown>;
        return {
          id: c.id,
          title: cd.title ?? '',
          content: cd.content ?? null,
          imageUrl: cd.imageUrl ?? null,
          displayOrder: cd.displayOrder ?? 0,
          published: cd.published ?? false,
        };
      });
      storiesList.push({
        id: doc.id,
        title: storyData.title ?? '',
        description: storyData.description ?? null,
        coverImageUrl: storyData.coverImageUrl ?? storyData.imageUrl ?? null,
        displayOrder: storyData.displayOrder ?? 0,
        published: storyData.published ?? false,
        chapters,
      });
    }

    return NextResponse.json({ success: true, data: storiesList });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);

    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const docRef = db.collection('stories').doc();
    await docRef.set({ ...body, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true, data: { id: docRef.id } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create story' } }, { status: 500 });
  }
}
