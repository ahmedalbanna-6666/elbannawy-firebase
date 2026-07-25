import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearStore, seedCollection } from '../helpers';

describe('Teacher Stats API', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns stats for a teacher with gradeId', async () => {
    const gradeId = 'grade-1';
    seedCollection('users', [
      { id: 'test-teacher-uid', data: { role: { role: 'teacher', grantedAt: '2024-01-01' }, fullName: 'Teacher', status: { status: 'active' }, isActive: true, deletedAt: null } },
      { id: 'student-1', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Student 1', gradeId, status: { status: 'active' }, isActive: true, deletedAt: null, lastActiveAt: new Date().toISOString() } },
      { id: 'student-2', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Student 2', gradeId, status: { status: 'active' }, isActive: true, deletedAt: null, lastActiveAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() } },
      { id: 'student-3', data: { role: { role: 'student', grantedAt: '2024-01-01' }, fullName: 'Student 3', gradeId, status: { status: 'active' }, isActive: true, deletedAt: null, lastActiveAt: new Date().toISOString() } },
    ]);
    seedCollection('units', [
      { id: 'unit-1', data: { title: 'Unit 1', gradeId, lessonIds: ['lesson-1', 'lesson-2'], deletedAt: null } },
      { id: 'unit-2', data: { title: 'Unit 2', gradeId, lessonIds: ['lesson-3'], deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/teacher/stats/route');
    const response = await GET(new (await import('next/server')).NextRequest(`http://localhost/api/v1/teacher/stats?gradeId=${gradeId}`));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { totalStudents: number; activeStudents: number; totalUnits: number; totalLessons: number } };
    expect(body.data.totalStudents).toBe(3);
    expect(body.data.totalUnits).toBe(2);
    expect(body.data.totalLessons).toBe(3);
  });

  it('returns zeros when no gradeId provided', async () => {
    seedCollection('users', [
      { id: 'test-teacher-uid', data: { role: { role: 'teacher', grantedAt: '2024-01-01' }, fullName: 'Teacher', status: { status: 'active' }, isActive: true, deletedAt: null } },
    ]);
    const { GET } = await import('@/app/api/v1/teacher/stats/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/teacher/stats'));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { totalStudents: number } };
    expect(body.data.totalStudents).toBe(0);
  });
});
