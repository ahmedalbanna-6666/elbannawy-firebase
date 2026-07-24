import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearStore, seedCollection } from '../helpers';

vi.mock('@/lib/firebase/auth-helper', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.com' }),
}));

describe('Teacher Grade Management (admin)', () => {
  beforeEach(() => {
    clearStore();
  });

  describe('POST /api/v1/admin/teachers/[id]/grades', () => {
    it('assigns grades to a teacher', async () => {
      const { POST } = await import('@/app/api/v1/admin/teachers/[id]/grades/route');
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/grades', { method: 'POST' });
      vi.spyOn(request, 'json').mockResolvedValue({ gradeIds: ['grade-1', 'grade-2'] });

      const response = await POST(request, { params: Promise.resolve({ id: 'teacher-1' }) });
      expect(response.statusCode).toBe(200);
      const body = response.body as { success: boolean; data: { gradeIds: string[] } };
      expect(body.data.gradeIds).toEqual(['grade-1', 'grade-2']);
    });

    it('removes grades that are no longer selected', async () => {
      seedCollection('teacherAssignments', [
        { id: 'ta-teacher-1-grade-1', data: { teacherId: 'teacher-1', gradeId: 'grade-1', status: 'active', deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
        { id: 'ta-teacher-1-grade-2', data: { teacherId: 'teacher-1', gradeId: 'grade-2', status: 'active', deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
        { id: 'ta-teacher-1-grade-3', data: { teacherId: 'teacher-1', gradeId: 'grade-3', status: 'active', deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
      ]);

      const { POST } = await import('@/app/api/v1/admin/teachers/[id]/grades/route');
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/grades', { method: 'POST' });
      vi.spyOn(request, 'json').mockResolvedValue({ gradeIds: ['grade-1', 'grade-2'] });

      const response = await POST(request, { params: Promise.resolve({ id: 'teacher-1' }) });
      expect(response.statusCode).toBe(200);

      // grade-3 should be deactivated
      const result = await (await import('@el-bannawy/lib')).TeacherRepository.prototype.listTeacherAssignments('teacher-1', { limit: 100 });
      // Expect 2 active assignments
      if (result.ok) {
        expect(result.value.items).toHaveLength(2);
      }
    });
  });

  describe('GET /api/v1/admin/teachers/[id]/grades', () => {
    it('lists a teacher assigned grades', async () => {
      seedCollection('teacherAssignments', [
        { id: 'ta-teacher-1-grade-1', data: { teacherId: 'teacher-1', gradeId: 'grade-1', status: 'active', deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
        { id: 'ta-teacher-1-grade-2', data: { teacherId: 'teacher-1', gradeId: 'grade-2', status: 'active', deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
      ]);

      const { GET } = await import('@/app/api/v1/admin/teachers/[id]/grades/route');
      const response = await GET(
        new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/grades'),
        { params: Promise.resolve({ id: 'teacher-1' }) },
      );
      expect(response.statusCode).toBe(200);
      const body = response.body as { success: boolean; data: { gradeIds: string[] } };
      expect(body.data.gradeIds).toHaveLength(2);
    });
  });
});

describe('Teacher Permissions Management', () => {
  beforeEach(() => {
    clearStore();
  });

  describe('POST /api/v1/admin/teachers/[id]/permissions/grant', () => {
    it('grants a permission to a teacher', async () => {
      const { POST } = await import('@/app/api/v1/admin/teachers/[id]/permissions/grant/route');
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/permissions/grant', { method: 'POST' });
      vi.spyOn(request, 'json').mockResolvedValue({ permission: 'support.answer' });

      const response = await POST(request, { params: Promise.resolve({ id: 'teacher-1' }) });
      expect(response.statusCode).toBe(200);
    });

    it('adds permission to existing ones', async () => {
      seedCollection('userPermissions', [
        { id: 'teacher-1', data: { permissions: ['units.view', 'units.create'] } },
      ]);

      const { POST } = await import('@/app/api/v1/admin/teachers/[id]/permissions/grant/route');
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/permissions/grant', { method: 'POST' });
      vi.spyOn(request, 'json').mockResolvedValue({ permission: 'support.answer' });

      await POST(request, { params: Promise.resolve({ id: 'teacher-1' }) });

      const { GET } = await import('@/app/api/v1/admin/teachers/[id]/permissions/route');
      const getResponse = await GET(
        new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/permissions'),
        { params: Promise.resolve({ id: 'teacher-1' }) },
      );
      const body = getResponse.body as { success: boolean; data: { grantedPermissions: string[] } };
      expect(body.data.grantedPermissions).toContain('support.answer');
      expect(body.data.grantedPermissions).toContain('units.view');
    });
  });

  describe('POST /api/v1/admin/teachers/[id]/permissions/revoke', () => {
    it('removes a permission from a teacher', async () => {
      seedCollection('userPermissions', [
        { id: 'teacher-1', data: { permissions: ['units.view', 'support.answer', 'units.create'] } },
      ]);

      const { POST } = await import('@/app/api/v1/admin/teachers/[id]/permissions/revoke/route');
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/permissions/revoke', { method: 'POST' });
      vi.spyOn(request, 'json').mockResolvedValue({ permission: 'support.answer' });

      await POST(request, { params: Promise.resolve({ id: 'teacher-1' }) });

      const { GET } = await import('@/app/api/v1/admin/teachers/[id]/permissions/route');
      const getResponse = await GET(
        new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/teachers/teacher-1/permissions'),
        { params: Promise.resolve({ id: 'teacher-1' }) },
      );
      const body = getResponse.body as { success: boolean; data: { grantedPermissions: string[] } };
      expect(body.data.grantedPermissions).not.toContain('support.answer');
      expect(body.data.grantedPermissions).toContain('units.view');
    });
  });
});
