import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getUserContext } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type');

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ success: true, data: { lessons: [], units: [], vocabulary: [] } });
    }

    const context = await getUserContext(decoded.uid);
    const gradeId = context?.gradeId;
    if (!gradeId) {
      return NextResponse.json({ success: true, data: { lessons: [], units: [], vocabulary: [] } });
    }

    const db = getAdminDb();
    const term = q.trim();

    const [lessonsSnap, unitsSnap, vocabSnap] = await Promise.all([
      db.collection('lessons').where('isPublished', '==', true).where('gradeId', '==', gradeId).select('title', 'titleAr').limit(50).get(),
      db.collection('units').where('published', '==', true).where('gradeId', '==', gradeId).select('name', 'nameAr', 'title', 'titleAr').limit(30).get(),
      db.collection('vocabularyItems').select('word', 'translation', 'lessonId').limit(200).get(),
    ]);

    const filteredLessons = lessonsSnap.docs
      .filter((d) => {
        const data = d.data();
        return (data.title as string)?.toLowerCase().includes(term.toLowerCase()) ||
               (data.titleAr as string)?.includes(term);
      })
      .slice(0, 10)
      .map((d) => ({ id: d.id, title: d.data().title, type: 'lesson' as const }));

    const filteredUnits = unitsSnap.docs
      .filter((d) => {
        const data = d.data();
        return (data.name as string)?.toLowerCase().includes(term.toLowerCase()) ||
               (data.nameAr as string)?.includes(term) ||
               (data.title as string)?.toLowerCase().includes(term.toLowerCase()) ||
               (data.titleAr as string)?.includes(term);
      })
      .slice(0, 10)
      .map((d) => ({ id: d.id, title: d.data().nameAr ?? d.data().name ?? d.data().title, type: 'unit' as const }));

    const filteredVocab = (type === 'vocabulary' || !type)
      ? vocabSnap.docs
          .filter((d) => {
            const data = d.data();
            return (data.word as string)?.toLowerCase().includes(term.toLowerCase()) ||
                   (data.translation as string)?.includes(term);
          })
          .slice(0, 10)
          .map((d) => ({ id: d.id, word: d.data().word, translation: d.data().translation, lessonId: d.data().lessonId, type: 'vocabulary' as const }))
      : [];

    const response = NextResponse.json({
      success: true,
      data: {
        lessons: filteredLessons,
        units: filteredUnits,
        vocabulary: filteredVocab,
      },
    });
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    return response;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}