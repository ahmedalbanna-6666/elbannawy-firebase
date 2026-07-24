import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearStore, seedCollection } from '../helpers';

vi.mock('@/lib/firebase/auth-helper', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.com' }),
}));

describe('GET /api/v1/admin/stages', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns all stages with their grades', async () => {
    seedCollection('stages', [
      { id: 'stage-1', data: { name: 'Primary', nameAr: 'ابتدائي', displayOrder: 1, educationalSystemId: 'sys-1', createdAt: '2024-01-01', updatedAt: '2024-01-01', deletedAt: null } },
      { id: 'stage-2', data: { name: 'Middle', nameAr: 'إعدادي', displayOrder: 2, educationalSystemId: 'sys-1', createdAt: '2024-01-01', updatedAt: '2024-01-01', deletedAt: null } },
    ]);
    seedCollection('grades', [
      { id: 'grade-1', data: { name: 'Grade 1', nameAr: 'الصف الأول', displayOrder: 1, stageId: 'stage-1', educationalSystemId: 'sys-1', createdAt: '2024-01-01', updatedAt: '2024-01-01', deletedAt: null } },
      { id: 'grade-2', data: { name: 'Grade 2', nameAr: 'الصف الثاني', displayOrder: 2, stageId: 'stage-1', educationalSystemId: 'sys-1', createdAt: '2024-01-01', updatedAt: '2024-01-01', deletedAt: null } },
      { id: 'grade-3', data: { name: 'Grade 1', nameAr: 'الصف الأول', displayOrder: 1, stageId: 'stage-2', educationalSystemId: 'sys-1', createdAt: '2024-01-01', updatedAt: '2024-01-01', deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/stages/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/stages'));
    expect(response.statusCode).toBe(200);
    const body = response.body as { success: boolean; data: Array<{ id: string; name: string; grades: Array<{ id: string }> }> };
    expect(body.data).toHaveLength(2);
    const primaryStage = body.data.find((s) => s.id === 'stage-1');
    expect(primaryStage?.grades).toHaveLength(2);
    const middleStage = body.data.find((s) => s.id === 'stage-2');
    expect(middleStage?.grades).toHaveLength(1);
  });

  it('returns empty array when no stages exist', async () => {
    const { GET } = await import('@/app/api/v1/admin/stages/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/stages'));
    expect(response.statusCode).toBe(200);
    const body = response.body as { success: boolean; data: unknown[] };
    expect(body.data).toEqual([]);
  });
});

describe('POST /api/v1/admin/stages', () => {
  beforeEach(() => {
    clearStore();
  });

  it('creates a stage when valid data provided', async () => {
    const { POST } = await import('@/app/api/v1/admin/stages/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/v1/admin/stages', { method: 'POST' });
    vi.spyOn(request, 'json').mockResolvedValue({ name: 'Primary', nameAr: 'ابتدائي', educationalSystemId: 'sys-1' });

    const response = await POST(request);
    expect(response.statusCode).toBe(201);
  });

  it('rejects request without required fields', async () => {
    const { POST } = await import('@/app/api/v1/admin/stages/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/v1/admin/stages', { method: 'POST' });
    vi.spyOn(request, 'json').mockResolvedValue({ name: 'Primary' });

    const response = await POST(request);
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /api/v1/admin/grades', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns all grades', async () => {
    seedCollection('grades', [
      { id: 'g1', data: { name: 'Grade 1', nameAr: 'الصف الأول', stageId: 'stage-1', displayOrder: 1, deletedAt: null } },
      { id: 'g2', data: { name: 'Grade 2', nameAr: 'الصف الثاني', stageId: 'stage-1', displayOrder: 2, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/grades/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/grades'));
    expect(response.statusCode).toBe(200);
    const body = response.body as { success: boolean; data: unknown[] };
    expect(body.data).toHaveLength(2);
  });
});
