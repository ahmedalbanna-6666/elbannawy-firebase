import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { QuestionImportService, HomeworkQuestionRepository } from '@el-bannawy/lib';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const TYPE_MAP: Record<string, string> = {
  MCQ: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
};

function mapMcqToQuestions(content: Record<string, unknown>): { prompt: string; options: Record<string, string>; questionType: string }[] {
  const categories = content.categories as Array<{ title: string; questions: Array<{ number: number; text: string; options: Record<string, string> }> }> | undefined;
  if (!categories) return [];
  return categories.flatMap((cat) =>
    (cat.questions ?? []).map((q) => ({
      prompt: q.text,
      options: { ...q.options },
      questionType: 'MULTIPLE_CHOICE',
    }))
  );
}

function mapContentToQuestions(content: Record<string, unknown>, activityType: string): { prompt: string; options: Record<string, string>; questionType: string }[] {
  if (activityType === 'MCQ') return mapMcqToQuestions(content);
  if (activityType === 'TRUE_FALSE') {
    const questions = content.questions as Array<{ number: number; text: string }> | undefined;
    return (questions ?? []).map((q) => ({
      prompt: q.text,
      options: { correct: '' },
      questionType: 'TRUE_FALSE',
    }));
  }
  return [];
}

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

    if (!file) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'No file provided' } }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.docx';
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, 'hw-import-' + id + '-' + String(Date.now()) + ext);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    let questions: { prompt: string; options: Record<string, string>; questionType: string }[] = [];

    try {
      if (ext === '.docx') {
        const importService = new QuestionImportService();
        const preview = await importService.preview(tempPath);
        if (preview.ok) {
          for (const activity of preview.value.activities) {
            const mapped = mapContentToQuestions(activity.content as unknown as Record<string, unknown>, activity.type);
            questions.push(...mapped);
          }
        }
      }
    } finally {
      try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    }

    const db = getAdminDb();
    const existing = await db.collection('homework').where('lessonId', '==', id).limit(1).get();

    const now = new Date().toISOString();
    const homeworkData: Record<string, unknown> = {
      lessonId: id,
      ownerType: 'LESSON',
      ownerId: id,
      title: title ?? file.name.replace(/\.[^.]+$/, ''),
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

    let homeworkId: string;

    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      await docRef.update({ ...homeworkData, updatedAt: now, contentVersion: ((existing.docs[0].data().contentVersion ?? 0) as number) + 1 });
      homeworkId = existing.docs[0].id;
    } else {
      const docRef = db.collection('homework').doc();
      await docRef.set(homeworkData);
      homeworkId = docRef.id;
    }

    const questionRepo = new HomeworkQuestionRepository();
    const savedQuestions: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qResult = await questionRepo.create({
        id: `hq-${homeworkId}-${String(i)}`,
        homeworkId,
        questionType: q.questionType as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'MATCHING',
        prompt: q.prompt,
        options: q.options,
        points: 1,
        displayOrder: i + 1,
      });
      if (qResult.ok) savedQuestions.push(qResult.value.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        homeworkId,
        title: homeworkData.title,
        questionCount: savedQuestions.length,
      },
      timestamp: now,
    }, { status: existing.empty ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
