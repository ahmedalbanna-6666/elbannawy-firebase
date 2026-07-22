import type {
  IActivityRepository,
  IActivity,
  IActivitySummary,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilter,
} from '../../../../repositories/contracts';
import type { PageQuery, Page } from '../../../../shared/types/pagination.types';
import type { RepositoryResult } from '../../../../shared/types/repository.types';

export class FakeActivityRepository implements IActivityRepository {
  private activities = new Map<string, IActivity>();

  private make(input: CreateActivityInput, now: string): IActivity {
    return {
      id: input.id,
      lessonId: input.lessonId,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      instructions: input.instructions,
      displayOrder: input.displayOrder,
      config: input.config,
      status: input.status ?? 'draft',
      isRequired: input.isRequired ?? true,
      isScorable: input.isScorable ?? true,
      isPractice: input.isPractice ?? false,
      timeLimit: input.timeLimit,
      maxAttempts: input.maxAttempts,
      retryable: input.retryable ?? false,
      prerequisiteActivityIds: input.prerequisiteActivityIds ?? [],
      metadata: {
        estimatedDuration: input.metadata?.estimatedDuration,
        skill: input.metadata?.skill,
        difficulty: input.metadata?.difficulty,
        tags: input.metadata?.tags ?? [],
        bloomLevel: input.metadata?.bloomLevel,
        aiGenerated: input.metadata?.aiGenerated ?? false,
      },
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      deletedAt: null,
    };
  }

  async createActivity(input: CreateActivityInput): Promise<RepositoryResult<IActivity>> {
    if (this.activities.has(input.id)) {
      return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Activity already exists: ${input.id}`, retryable: false, requestId: '' } };
    }
    const now = new Date().toISOString();
    const activity = this.make(input, now);
    this.activities.set(input.id, activity);
    return { ok: true, value: { ...activity } };
  }

  async updateActivity(id: string, input: UpdateActivityInput, _expectedVersion: number): Promise<RepositoryResult<IActivity>> {
    const existing = this.activities.get(id);
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId: '' } };
    }
    const updated: IActivity = {
      ...existing,
      ...input,
      metadata: input.metadata ? { ...existing.metadata, ...input.metadata, tags: input.metadata.tags ?? existing.metadata.tags } : existing.metadata,
      updatedAt: new Date().toISOString(),
    };
    this.activities.set(id, updated);
    return { ok: true, value: { ...updated } };
  }

  async getActivityById(id: string): Promise<RepositoryResult<IActivity>> {
    const activity = this.activities.get(id);
    if (!activity || activity.deletedAt) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId: '' } };
    }
    return { ok: true, value: { ...activity } };
  }

  async listActivities(filter: ActivityFilter, page: PageQuery): Promise<RepositoryResult<Page<IActivitySummary>>> {
    let items = Array.from(this.activities.values()).filter((a) => !a.deletedAt);
    if (filter.lessonId) items = items.filter((a) => a.lessonId === filter.lessonId);
    if (filter.type) items = items.filter((a) => a.type === filter.type);
    if (filter.status) items = items.filter((a) => a.status === filter.status);
    if (filter.isRequired !== undefined) items = items.filter((a) => a.isRequired === filter.isRequired);
    if (filter.isScorable !== undefined) items = items.filter((a) => a.isScorable === filter.isScorable);
    if (filter.isPractice !== undefined) items = items.filter((a) => a.isPractice === filter.isPractice);
    if (filter.search) {
      const t = filter.search.toLowerCase();
      items = items.filter((a) => a.title.toLowerCase().includes(t) || a.type.toLowerCase().includes(t));
    }
    items.sort((a, b) => a.displayOrder - b.displayOrder);
    const limit = page.limit ?? 20;
    const startIndex = page.cursor ? Number(page.cursor) : 0;
    const sliced = items.slice(startIndex, startIndex + limit);
    const nextCursor = (startIndex + limit < items.length) ? String(startIndex + limit) : null;
    const summaries: IActivitySummary[] = sliced.map((a) => ({
      id: a.id, lessonId: a.lessonId, type: a.type, title: a.title,
      subtitle: a.subtitle, displayOrder: a.displayOrder, status: a.status,
      isRequired: a.isRequired, isScorable: a.isScorable, isPractice: a.isPractice,
      metadata: a.metadata, createdAt: a.createdAt,
    }));
    return { ok: true, value: { items: summaries, nextCursor } };
  }

  async getActivitiesByLesson(lessonId: string): Promise<RepositoryResult<IActivity[]>> {
    const items = Array.from(this.activities.values())
      .filter((a) => a.lessonId === lessonId && !a.deletedAt)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return { ok: true, value: items.map((a) => ({ ...a })) };
  }

  async searchActivities(searchTerm: string, page: PageQuery): Promise<RepositoryResult<Page<IActivitySummary>>> {
    const all = await this.listActivities({}, { limit: 1000 });
    if (!all.ok) return all;
    const term = searchTerm.toLowerCase();
    const filtered = all.value.items.filter((a) => a.title.toLowerCase().includes(term) || a.type.toLowerCase().includes(term));
    const startIndex = page.cursor ? Number(page.cursor) : 0;
    const sliced = filtered.slice(startIndex, startIndex + page.limit);
    const nextCursor = (startIndex + page.limit < filtered.length) ? String(startIndex + page.limit) : null;
    return { ok: true, value: { items: sliced, nextCursor } };
  }

  async softDeleteActivity(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    const existing = this.activities.get(id);
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
    }
    this.activities.set(id, { ...existing, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return { ok: true, value: undefined };
  }

  async restoreActivity(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    const existing = this.activities.get(id);
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
    }
    this.activities.set(id, { ...existing, deletedAt: null, updatedAt: new Date().toISOString() });
    return { ok: true, value: undefined };
  }

  async publishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    const existing = this.activities.get(id);
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
    }
    const updated = { ...existing, status: 'published' as const, updatedAt: new Date().toISOString() };
    this.activities.set(id, updated);
    return { ok: true, value: { ...updated } };
  }

  async unpublishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    const existing = this.activities.get(id);
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
    }
    const updated = { ...existing, status: 'draft' as const, updatedAt: new Date().toISOString() };
    this.activities.set(id, updated);
    return { ok: true, value: { ...updated } };
  }

  async changeActivityOrder(id: string, newOrder: number, expectedVersion: number): Promise<RepositoryResult<IActivity>> {
    return this.updateActivity(id, { displayOrder: newOrder }, expectedVersion);
  }
}
