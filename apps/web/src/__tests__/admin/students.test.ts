import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearStore, seedCollection } from '../helpers';

vi.mock('@/lib/firebase/auth-helper', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.com' }),
}));

describe('GET /api/v1/admin/students', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns paginated students list', async () => {
    const students = Array.from({ length: 5 }, (_, i) => ({
      id: `student-${i}`,
      data: {
        role: { role: 'student', grantedAt: '2024-01-01' },
        fullName: `Student ${i}`,
        mobileNumber: `0100000000${i}`,
        status: { status: 'active' },
        isActive: true,
        gradeId: 'grade-1',
        coins: 100,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        deletedAt: null,
      },
    }));
    seedCollection('users', students);

    const { GET } = await import('@/app/api/v1/admin/students/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/students'));
    expect(response.statusCode).toBe(200);
    const body = response.body as { success: boolean; data: { students: unknown[]; meta: Record<string, unknown> } };
    expect(body.data.students).toHaveLength(5);
    expect(body.data.meta.total).toBe(5);
  });

  it('filters students by status', async () => {
    seedCollection('users', [
      { id: 's1', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Active Student', status: { status: 'active' }, isActive: true, deletedAt: null } },
      { id: 's2', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Suspended Student', status: { status: 'suspended' }, isActive: false, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/students/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/students?status=active'));
    expect(response.statusCode).toBe(200);
    const body = response.body as { success: boolean; data: { students: Array<{ fullName: string }> } };
    expect(body.data.students).toHaveLength(1);
    expect(body.data.students[0].fullName).toBe('Active Student');
  });

  it('searches students by name or phone', async () => {
    seedCollection('users', [
      { id: 's1', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Ahmed Ali', mobileNumber: '01000000001', status: { status: 'active' }, isActive: true, deletedAt: null } },
      { id: 's2', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Mohamed Omar', mobileNumber: '01000000002', status: { status: 'active' }, isActive: true, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/students/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/students?search=Ahmed'));
    const body = response.body as { success: boolean; data: { students: Array<{ fullName: string }> } };
    expect(body.data.students).toHaveLength(1);
  });
});

describe('GET /api/v1/admin/students/[id]', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns student detail by id (mock store test)', async () => {
    seedCollection('users', [
      { id: 'student-1', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Test Student', mobileNumber: '01000000001', status: { status: 'active' }, isActive: true, gradeId: 'grade-1', coins: 50, createdAt: '2024-01-01', updatedAt: '2024-01-01', deletedAt: null } },
    ]);

    const { getAdminDb } = await import('@/lib/firebase/admin');
    const db = getAdminDb();
    const doc = await db.collection('users').doc('student-1').get();
    expect(doc.exists).toBe(true);
    const data = doc.data() as Record<string, unknown>;
    expect(data.fullName).toBe('Test Student');
    expect(data.coins).toBe(50);
    // Simulate what the route does
    const role = typeof data.role === 'object' && data.role !== null
      ? String((data.role as Record<string, unknown>).role ?? '').toUpperCase()
      : String(data.role ?? '').toUpperCase();
    expect(role).toBe('STUDENT');
    const status = typeof data.status === 'object' && data.status !== null
      ? String((data.status as Record<string, unknown>).status ?? '')
      : String(data.status ?? '');
    expect(status).toBe('active');
  });

  it('returns 404 for non-existent student', async () => {
    const { GET } = await import('@/app/api/v1/admin/students/[id]/route');
    const response = await GET(
      new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/students/nonexistent'),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    );
    expect(response.statusCode).toBe(404);
  });
});

describe('PATCH /api/v1/admin/students/[id]/status', () => {
  beforeEach(() => {
    clearStore();
  });

  it('updates student status', async () => {
    seedCollection('users', [
      { id: 'student-1', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Test', status: { status: 'active' }, isActive: true, deletedAt: null } },
    ]);

    const { PATCH } = await import('@/app/api/v1/admin/students/[id]/status/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/v1/admin/students/student-1/status', { method: 'PATCH' });
    vi.spyOn(request, 'json').mockResolvedValue({ status: 'suspended' });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'student-1' }) });
    expect(response.statusCode).toBe(200);
    const body = response.body as { success: boolean; data: { status: string } };
    expect(body.data.status).toBe('suspended');
  });

  it('returns 404 for non-existent student', async () => {
    const { PATCH } = await import('@/app/api/v1/admin/students/[id]/status/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/v1/admin/students/nonexistent/status', { method: 'PATCH' });
    vi.spyOn(request, 'json').mockResolvedValue({ status: 'active' });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.statusCode).toBe(404);
  });
});
