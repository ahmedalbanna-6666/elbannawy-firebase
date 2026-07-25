import { NextRequest, NextResponse } from 'next/server';
import { QuestionImportService, QuizQuestionRepository, QuizRepository } from '@el-bannawy/lib';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const quizRepo = new QuizRepository();
const questionRepo = new QuizQuestionRepository();

function mapMcqToQuestions(content: Record<string, unknown>): { prompt: string; options: Record<string, string>; questionType: string }[] {
  const categories = content.categories as Array<{ name: string; questions: Array<{ number: number; question: string; options: Array<{ label: string; text: string }> }> }> | undefined;
  const answers = content.answers as Record<number, string> | undefined;
  if (!categories) return [];
  return categories.flatMap((cat) =>
    (cat.questions ?? []).map((q) => {
      const opts: Record<string, string> = {};
      if (q.options) {
        for (const opt of q.options) {
          opts[opt.label] = opt.text;
        }
      }
      const correctLabel = answers?.[q.number];
      if (correctLabel) opts.correct = correctLabel;
      return { prompt: q.question, options: opts, questionType: 'MULTIPLE_CHOICE' };
    })
  );
}

function mapContentToQuestions(content: Record<string, unknown>, activityType: string): { prompt: string; options: Record<string, string>; questionType: string }[] {
  if (activityType === 'MCQ') return mapMcqToQuestions(content);
  if (activityType === 'TRUE_FALSE') {
    const questions = content.questions as Array<{ number: number; statement: string }> | undefined;
    const answers = content.answers as Record<number, boolean> | undefined;
    return (questions ?? []).map((q) => ({
      prompt: q.statement,
      options: { correct: answers?.[q.number] === true ? 'true' : 'false' },
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

    let questions: { prompt: string; options: Record<string, string>; questionType: string }[] = [];
    try {
      const ext = path.extname(file.name) || '.docx';
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, 'q-import-' + id + '-' + String(Date.now()) + ext);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(tempPath, buffer);
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
    } catch { /* if parsing fails, still create quiz with 0 questions */ }

    const existing = await quizRepo.getByLessonId(id);
    const now = new Date().toISOString();
    let quizId: string;

    if (existing.ok && existing.value) {
      quizId = existing.value.id;
      await quizRepo.update(quizId, {
        title: title ?? file.name.replace(/\.[^.]+$/, ''),
        instructions: instructions ?? '',
        passingScore: passingScore ? parseInt(passingScore, 10) : 60,
        published: true,
      }, 0);
    } else {
      const createResult = await quizRepo.create({
        id: 'quiz-' + id + '-' + String(Date.now()),
        lessonId: id,
        title: title ?? file.name.replace(/\.[^.]+$/, ''),
        instructions: instructions ?? '',
        passingScore: passingScore ? parseInt(passingScore, 10) : 60,
        maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : 1,
        published: true,
        xpReward: 20,
        requiredForCompletion: true,
      });
      if (!createResult.ok) {
        return NextResponse.json({ success: false, error: createResult.error }, { status: 500 });
      }
      quizId = createResult.value.id;
    }

    const savedQuestions: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qResult = await questionRepo.create({
        id: `qq-${quizId}-${String(i)}`,
        quizId,
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
      data: { quizId, title: title ?? file.name.replace(/\.[^.]+$/, ''), questionCount: savedQuestions.length },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' },
    }, { status: 500 });
  }
}
