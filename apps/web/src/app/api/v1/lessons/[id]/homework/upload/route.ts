import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();
    const existing = await db.collection('homework').where('lessonId', '==', id).limit(1).get();

    const now = new Date().toISOString();
    const homeworkData = {
      lessonId: id,
      ownerType: 'LESSON',
      ownerId: id,
      title: body.title ?? 'Homework',
      instructions: body.instructions ?? null,
      passingScore: body.passingScore ?? 50,
      maxAttempts: body.maxAttempts ?? null,
      unlimitedAttempts: body.unlimitedAttempts ?? true,
      published: body.published ?? false,
      allowRetry: body.allowRetry ?? true,
      showAnswers: body.showAnswers ?? false,
      xpReward: body.xpReward ?? 10,
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
