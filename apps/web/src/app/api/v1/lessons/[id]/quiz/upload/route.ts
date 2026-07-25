import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const instructions = formData.get('instructions') as string | null;
    const passingScore = formData.get('passingScore') as string | null;
    const maxAttempts = formData.get('maxAttempts') as string | null;

    const db = getAdminDb();
    const existing = await db.collection('quizzes').where('lessonId', '==', id).limit(1).get();

    const now = new Date().toISOString();
    const quizData: Record<string, unknown> = {
      lessonId: id,
      ownerType: 'LESSON',
      ownerId: id,
      title: title ?? (file ? file.name.replace(/\.[^.]+$/, '') : 'End Lesson Assessment'),
      instructions: instructions ?? null,
      passingScore: passingScore ? parseInt(passingScore, 10) : 60,
      maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
      unlimitedAttempts: true,
      published: false,
      allowRetry: true,
      showAnswers: false,
      xpReward: 20,
      requiredForCompletion: true,
      contentVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      await docRef.update({ ...quizData, updatedAt: now, contentVersion: (existing.docs[0].data().contentVersion ?? 0) + 1 });
      const updated = await docRef.get();
      return NextResponse.json({ success: true, data: { id: updated.id, ...updated.data() }, timestamp: now });
    }

    const docRef = db.collection('quizzes').doc();
    await docRef.set(quizData);
    return NextResponse.json(
      { success: true, data: { id: docRef.id, ...quizData }, timestamp: now },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
