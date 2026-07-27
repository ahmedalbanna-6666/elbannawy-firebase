import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService, VocabularyItemRepository, LessonDocumentRepository } from '@el-bannawy/lib';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);
const vocabRepo = new VocabularyItemRepository();
const docRepo = new LessonDocumentRepository();

function mapErrorCode(code: string): number {
  switch (code) {
    case 'INVALID_INPUT': return 400;
    case 'NOT_FOUND': return 404;
    case 'ALREADY_EXISTS': return 409;
    case 'CONFLICT': return 409;
    case 'FORBIDDEN': return 403;
    case 'PRECONDITION_FAILED': return 412;
    case 'RATE_LIMITED': return 429;
    case 'UNAVAILABLE': return 503;
    default: return 500;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const { searchParams } = new URL(_request.url);
  const prev = searchParams.get('prev');
  const next = searchParams.get('next');

  let decoded: { uid: string };
  try {
    const result = await authenticateRequest(_request);
    if (!result) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    decoded = result;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    if (prev === 'true') {
      const lesson = await applicationService.getLessonById(id);
      if (!lesson.ok) return NextResponse.json({ success: false, error: lesson.error }, { status: mapErrorCode(lesson.error.code) });
      const prevResult = await applicationService.getPreviousLesson(lesson.value.unitId, lesson.value.displayOrder);
      if (!prevResult.ok) return NextResponse.json({ success: false, error: prevResult.error }, { status: mapErrorCode(prevResult.error.code) });
      return NextResponse.json({ success: true, data: prevResult.value });
    }
    if (next === 'true') {
      const lesson = await applicationService.getLessonById(id);
      if (!lesson.ok) return NextResponse.json({ success: false, error: lesson.error }, { status: mapErrorCode(lesson.error.code) });
      const nextResult = await applicationService.getNextLesson(lesson.value.unitId, lesson.value.displayOrder);
      if (!nextResult.ok) return NextResponse.json({ success: false, error: nextResult.error }, { status: mapErrorCode(nextResult.error.code) });
      return NextResponse.json({ success: true, data: nextResult.value });
    }

    const result = await applicationService.getLessonById(id);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });

    const lesson = result.value;

    const vocabResult = await vocabRepo.listByLesson(id);
    const vocabItems = vocabResult.ok ? vocabResult.value : [];

    const db = getAdminDb();
    const videoSnap = await db.collection('lessonVideos').where('lessonId', '==', id).orderBy('displayOrder', 'asc').select('title', 'youtubeUrl', 'youtubeId', 'providerName', 'providerVideoId', 'providerUrl', 'duration', 'displayOrder').get();
    const videos = videoSnap.docs.map(d => {
      const dta = d.data() as Record<string, unknown>;
      return { id: d.id, title: String(dta.title ?? ''), youtubeUrl: String(dta.youtubeUrl ?? ''), youtubeId: String(dta.youtubeId ?? ''), providerName: String(dta.providerName ?? 'youtube'), providerVideoId: String(dta.providerVideoId ?? ''), providerUrl: String(dta.providerUrl ?? ''), duration: Number(dta.duration ?? 0), displayOrder: Number(dta.displayOrder ?? 0) };
    });

    const videoList = videos.map(v => ({
      id: v.id,
      title: v.title,
      youtubeUrl: v.youtubeUrl,
      youtubeId: v.youtubeId,
      providerName: v.providerName,
      providerVideoId: v.providerVideoId,
      providerUrl: v.providerUrl,
      duration: v.duration,
      displayOrder: v.displayOrder,
      timelineEvents: [],
      activities: [],
    }));

    const vocabGroups = [{
      id: null,
      title: 'Lesson Vocabulary',
      displayOrder: 0,
      items: vocabItems.map(v => ({ id: v.id, word: v.word, translation: v.translation, definition: v.definition, example: v.example, partOfSpeech: v.partOfSpeech, displayOrder: v.displayOrder })),
    }];

    const docResult = await docRepo.getByLessonId(id);
    const document = docResult.ok && docResult.value
      ? { id: docResult.value.id, fileName: docResult.value.fileName, downloadable: docResult.value.downloadable, mimeType: docResult.value.mimeType }
      : null;

    const enriched = {
      id: lesson.id,
      title: lesson.title,
      unitId: lesson.unitId,
      displayOrder: lesson.displayOrder,
      estimatedDuration: lesson.estimatedDuration ?? 30,
      isPremium: false,
      sequentialMode: true,
      homeworkEnabled: false,
      quizEnabled: false,
      xpReward: 10,
      passingScore: 60,
      progress: null,
      unit: { id: lesson.unitId, title: lesson.title, displayOrder: lesson.displayOrder, grade: { id: '', name: '' } },
      videos: videoList,
      vocabulary: { groups: vocabGroups },
      settings: null,
      document,
    };

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  let decoded: { uid: string };
  try {
    const result = await authenticateRequest(request);
    if (!result) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    decoded = result;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  const expectedVersion = Number(body._expectedVersion) || 0;

  try {
    const result = await applicationService.updateLesson(id, body, expectedVersion);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const requestId = `delete-${id}-${String(Date.now())}`;

  let decoded: { uid: string };
  try {
    const result = await authenticateRequest(_request);
    if (!result) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    decoded = result;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const result = await applicationService.softDeleteLesson(id, requestId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: mapErrorCode(result.error.code) });
    }
    return NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
