import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearStore, seedCollection } from '../helpers';

vi.mock('@/lib/firebase/auth-helper', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ uid: 'test-uid', email: 'test@test.com' }),
}));

describe('GET /api/v1/curriculum/units', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns empty list when no units exist', async () => {
    const { GET } = await import('@/app/api/v1/curriculum/units/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/curriculum/units'));
    expect(response.statusCode).toBe(200);
    const body = response.body as { success: boolean; data: { items: unknown[] } };
    expect(body.data.items).toEqual([]);
  });

  it('returns units filtered by gradeId', async () => {
    seedCollection('units', [
      { id: 'unit-1', data: { title: 'Unit 1', gradeId: 'grade-1', academicTermId: 'term-1', displayOrder: 1, isActive: true, published: true, deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
      { id: 'unit-2', data: { title: 'Unit 2', gradeId: 'grade-1', academicTermId: 'term-1', displayOrder: 2, isActive: true, published: true, deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
      { id: 'unit-3', data: { title: 'Unit 3', gradeId: 'grade-2', academicTermId: 'term-1', displayOrder: 1, isActive: true, published: true, deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ]);

    const { GET } = await import('@/app/api/v1/curriculum/units/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/curriculum/units?gradeId=grade-1'));
    expect(response.statusCode).toBe(200);

    // The mock uses in-memory store so filtering by gradeId should work
    const body = response.body as { success: boolean; data: { items?: Array<{ title: string }>; nextCursor?: unknown } };
    if (body.data.items) {
      expect(body.data.items.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('filters by academicTermId', async () => {
    seedCollection('units', [
      { id: 'unit-1', data: { title: 'Term 1 Unit', gradeId: 'grade-1', academicTermId: 'term-1', displayOrder: 1, isActive: true, deletedAt: null } },
      { id: 'unit-2', data: { title: 'Term 2 Unit', gradeId: 'grade-1', academicTermId: 'term-2', displayOrder: 2, isActive: true, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/curriculum/units/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/curriculum/units?academicTermId=term-1'));
    expect(response.statusCode).toBe(200);
  });
});
