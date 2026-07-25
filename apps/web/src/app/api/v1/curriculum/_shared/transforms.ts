import { CurriculumRepository } from '@el-bannawy/lib';

const curriculumRepo = new CurriculumRepository();

const gradeNameCache = new Map<string, { name: string; stageName: string }>();

async function resolveGrade(
  gradeId: string | null | undefined,
): Promise<{ id: string; name: string; stage: { id: string; name: string } }> {
  if (!gradeId) return { id: '', name: '', stage: { id: '', name: '' } };

  const cached = gradeNameCache.get(gradeId);
  if (cached) return { id: gradeId, name: cached.name, stage: { id: cached.stageName, name: cached.stageName } };

  const gradeResult = await curriculumRepo.getGradeById(gradeId);
  if (!gradeResult.ok) return { id: gradeId, name: '', stage: { id: '', name: '' } };

  const grade = gradeResult.value;
  const gradeName = grade.nameAr || grade.name;

  let stageName = '';
  if (grade.stageId) {
    const stageResult = await curriculumRepo.getStageById(grade.stageId);
    if (stageResult.ok) stageName = stageResult.value.nameAr || stageResult.value.name;
  }

  gradeNameCache.set(gradeId, { name: gradeName, stageName });

  return { id: gradeId, name: gradeName, stage: { id: grade.stageId, name: stageName } };
}

export function toFrontendUnit(u: Record<string, unknown>): Record<string, unknown> {
  return {
    id: u.id,
    title: u.name ?? u.nameAr ?? '',
    description: u.description ?? null,
    displayOrder: u.order ?? 0,
    published: u.published ?? false,
    isPremium: u.isPremium ?? false,
    priceCoins: u.priceCoins ?? (u.isPremium ? 50 : 0),
    lockedOverride: (u.lockedOverride as boolean | null) ?? null,
    gradeId: u.gradeId ?? null,
    academicYearId: u.academicYearId ?? null,
    educationalSystemId: u.educationalSystemId ?? null,
    createdAt: u.createdAt ?? new Date().toISOString(),
    updatedAt: u.updatedAt ?? new Date().toISOString(),
    grade: { id: u.gradeId ?? '', name: '', stage: { id: '', name: '' } },
    _count: { lessons: (u._lessonCount as number) ?? 0 },
  };
}

export async function toFrontendUnitEnriched(
  u: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const unit = toFrontendUnit(u);
  unit.grade = await resolveGrade(u.gradeId as string | null | undefined);
  return unit;
}

export function toFrontendLesson(l: Record<string, unknown>): Record<string, unknown> {
  return {
    id: l.id,
    title: l.title ?? '',
    displayOrder: l.displayOrder ?? 0,
    published: l.isPublished ?? l.status === 'published',
    isPremium: l.isPremium ?? false,
    lockedOverride: l.lockedOverride ?? null,
    homeworkEnabled: l.homeworkEnabled ?? false,
    quizEnabled: l.quizEnabled ?? false,
    estimatedDuration: l.estimatedDuration ?? null,
    createdAt: l.createdAt ?? new Date().toISOString(),
  };
}

export function fromFrontendUnitCreate(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: body.id ?? `unit-${String(Date.now())}`,
    name: body.title ?? body.name ?? '',
    nameAr: body.title ?? body.name ?? '',
    description: body.description ?? '',
    order: body.displayOrder ?? body.order ?? 0,
    academicTermId: body.termId ?? body.academicTermId ?? '',
    isActive: true,
    isPremium: body.isPremium ?? false,
    priceCoins: body.priceCoins ?? (body.isPremium ? 50 : undefined),
    published: body.published ?? false,
  };
  if (body.isActive !== undefined) payload.isActive = body.isActive;
  if (body.lockedOverride !== undefined) payload.lockedOverride = body.lockedOverride;
  if (body.gradeId) payload.gradeId = body.gradeId;
  if (body.academicYearId) payload.academicYearId = body.academicYearId;
  if (body.educationalSystemId) payload.educationalSystemId = body.educationalSystemId;
  else if (body.educationalSystem) payload.educationalSystemId = body.educationalSystem;
  return payload;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || `lesson-${String(Date.now())}`;
}

export function fromFrontendLesson(body: Record<string, unknown>): Record<string, unknown> {
  const title = (body.title ?? body.name ?? '') as string;
  return {
    id: body.id ?? `lesson-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`,
    unitId: (body.unitId ?? '') as string,
    title,
    slug: (body.slug as string) ?? slugify(title),
    description: (body.description as string) ?? '',
    displayOrder: (body.displayOrder as number) ?? (body.order as number) ?? 0,
    isPublished: body.published === true || body.isPublished === true,
    status: body.status ?? (body.published === true ? 'published' : 'draft'),
    isVisible: body.isVisible !== false,
    isPremium: body.isPremium === true,
    lockedOverride: body.lockedOverride === true ? true : body.lockedOverride === false ? false : null,
    homeworkEnabled: body.homeworkEnabled === true,
    quizEnabled: body.quizEnabled === true,
    estimatedDuration: (body.estimatedDuration as number) ?? undefined,
  };
}

export function fromFrontendLessonUpdate(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (body.title !== undefined) payload.title = body.title;
  if (body.slug !== undefined) payload.slug = body.slug;
  if (body.description !== undefined) payload.description = body.description;
  if (body.displayOrder !== undefined) payload.displayOrder = body.displayOrder;
  if (body.order !== undefined) payload.displayOrder = body.order;
  if (body.published !== undefined) payload.isPublished = body.published === true;
  if (body.isPublished !== undefined) payload.isPublished = body.isPublished === true;
  if (body.status !== undefined) payload.status = body.status;
  if (body.isVisible !== undefined) payload.isVisible = body.isVisible;
  if (body.isPremium !== undefined) payload.isPremium = body.isPremium === true;
  if (body.lockedOverride !== undefined) payload.lockedOverride = body.lockedOverride === true ? true : body.lockedOverride === false ? false : null;
  if (body.homeworkEnabled !== undefined) payload.homeworkEnabled = body.homeworkEnabled === true;
  if (body.quizEnabled !== undefined) payload.quizEnabled = body.quizEnabled === true;
  if (body.estimatedDuration !== undefined) payload.estimatedDuration = body.estimatedDuration;
  return payload;
}

export function fromFrontendUnitUpdate(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (body.title !== undefined) { payload.name = body.title; payload.nameAr = body.title; }
  if (body.description !== undefined) payload.description = body.description;
  if (body.displayOrder !== undefined) payload.order = body.displayOrder;
  if (body.order !== undefined) payload.order = body.order;
  if (body.published !== undefined) payload.published = body.published;
  if (body.isPremium !== undefined) payload.isPremium = body.isPremium;
  if (body.isActive !== undefined) payload.isActive = body.isActive;
  if (body.gradeId !== undefined) payload.gradeId = body.gradeId ?? null;
  if (body.academicYearId !== undefined) payload.academicYearId = body.academicYearId ?? null;
  if (body.educationalSystemId !== undefined) payload.educationalSystemId = body.educationalSystemId ?? null;
  if (body.lockedOverride !== undefined) payload.lockedOverride = body.lockedOverride;
  return payload;
}
