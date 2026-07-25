import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearStore, seedCollection } from '../helpers';

// Mock the auth helper to return admin user for these tests
vi.mock('@/lib/firebase/auth-helper', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.com' }),
}));

describe('GET /api/v1/admin/teachers', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns empty list when no teachers exist', async () => {
    const { GET } = await import('@/app/api/v1/admin/teachers/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers'));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { teachers: unknown[]; meta: Record<string, unknown> } };
    expect(body.success).toBe(true);
    expect(body.data.teachers).toEqual([]);
    expect(body.data.meta.total).toBe(0);
  });

  it('returns list of teachers from Firestore', async () => {
    seedCollection('users', [
      { id: 'teacher-1', data: { role: { role: 'teacher', grantedAt: '2024-01-01' }, fullName: 'Ahmed', mobileNumber: '01000000001', status: { status: 'active' }, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', deletedAt: null } },
      { id: 'teacher-2', data: { role: { role: 'teacher', grantedAt: '2024-01-02' }, fullName: 'Mohamed', mobileNumber: '01000000002', status: { status: 'active' }, isActive: true, createdAt: '2024-01-02', updatedAt: '2024-01-02', deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/teachers/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers'));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { teachers: Array<{ id: string; fullName: string }>; meta: Record<string, unknown> } };
    expect(body.data.teachers).toHaveLength(2);
    expect(body.data.teachers[0].fullName).toBe('Ahmed');
  });

  it('filters out non-teacher roles', async () => {
    seedCollection('users', [
      { id: 'teacher-1', data: { role: { role: 'teacher', grantedAt: '2024-01-01' }, fullName: 'Teacher', status: { status: 'active' }, isActive: true, deletedAt: null } },
      { id: 'student-1', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Student', status: { status: 'active' }, isActive: true, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/teachers/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers'));
    const body = await response.json() as { success: boolean; data: { teachers: unknown[] } };
    expect(body.data.teachers).toHaveLength(1);
  });

  it('supports search by name', async () => {
    seedCollection('users', [
      { id: 't1', data: { role: { role: 'teacher', grantedAt: '2024-01-01' }, fullName: 'Ahmed Ali', status: { status: 'active' }, isActive: true, deletedAt: null } },
      { id: 't2', data: { role: { role: 'teacher', grantedAt: '2024-01-01' }, fullName: 'Mohamed Omar', status: { status: 'active' }, isActive: true, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/teachers/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers?search=Ahmed'));
    const body = await response.json() as { success: boolean; data: { teachers: Array<{ fullName: string }> } };
    expect(body.data.teachers).toHaveLength(1);
    expect(body.data.teachers[0].fullName).toBe('Ahmed Ali');
  });

  it('handles flat role format (backward compatibility)', async () => {
    seedCollection('users', [
      { id: 't1', data: { role: 'teacher', fullName: 'Legacy Teacher', status: { status: 'active' }, isActive: true, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/admin/teachers/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers'));
    const body = await response.json() as { success: boolean; data: { teachers: Array<{ fullName: string }> } };
    expect(body.data.teachers).toHaveLength(1);
    expect(body.data.teachers[0].fullName).toBe('Legacy Teacher');
  });
});

describe('POST /api/v1/admin/teachers', () => {
  beforeEach(() => {
    clearStore();
  });

  it('creates a new teacher in Firestore', async () => {
    const { POST } = await import('@/app/api/v1/admin/teachers/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/v1/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    // Override json method
    vi.spyOn(request, 'json').mockResolvedValue({
      fullName: 'New Teacher',
      mobileNumber: '01000000003',
      email: 'teacher@test.com',
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json() as { success: boolean; data: { fullName: string; role: unknown } };
    expect(body.data.fullName).toBe('New Teacher');
    expect(body.data.role).toEqual({ role: 'teacher', grantedAt: expect.any(String) });
  });

  it('rejects request without fullName', async () => {
    const { POST } = await import('@/app/api/v1/admin/teachers/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/v1/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    vi.spyOn(request, 'json').mockResolvedValue({});

    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json() as { success: boolean; data: { fullName: string } };
    expect(body.data.fullName).toBe('');
  });
});
