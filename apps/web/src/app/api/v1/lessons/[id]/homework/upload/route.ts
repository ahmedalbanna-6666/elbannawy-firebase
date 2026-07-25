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
    const existing = await db.collection('homework').where('lessonId', '==', id).limit(1).get();

    const now = new Date().toISOString();
    const homeworkData: Record<string, unknown> = {
      lessonId: id,
      ownerType: 'LESSON',
      ownerId: id,
      title: title ?? (file ? file.name.replace(/\.[^.]+$/, '') : 'Homework'),
      instructions: instructions ?? null,
      passingScore: passingScore ? parseInt(passingScore, 10) : 50,
      maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
      unlimitedAttempts: true,
      published: false,
      allowRetry: true,
      showAnswers: false,
      xpReward: 10,
      contentVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      await docRef.update({ ...homeworkData, updatedAt: now, contentVersion: (existing.docs[0].data().contentVersion ?? 0) + 1 });
      const updated = await docRef.get();
      return NextResponse.json({ success: true, data: { id: updated.id, ...updated.data() }, timestamp: now });
    }

    const docRef = db.collection('homework').doc();
    await docRef.set(homeworkData);
    return NextResponse.json(
      { success: true, data: { id: docRef.id, ...homeworkData }, timestamp: now },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
