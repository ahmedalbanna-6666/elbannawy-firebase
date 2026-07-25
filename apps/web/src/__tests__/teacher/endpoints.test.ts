import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearStore, seedCollection } from '../helpers';

vi.mock('@/lib/firebase/auth-helper', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ uid: 'teacher-uid', email: 'teacher@test.com' }),
}));

describe('GET /api/v1/teachers/my-grades', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns empty when teacher has no assignments', async () => {
    const { GET } = await import('@/app/api/v1/teachers/my-grades/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/teachers/my-grades'));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { gradeIds: string[]; grades: unknown[] } };
    expect(body.data.gradeIds).toEqual([]);
    expect(body.data.grades).toEqual([]);
  });

  it('returns assigned grades when teacher has assignments', async () => {
    seedCollection('teacherAssignments', [
      { id: 'ta-teacher-uid-grade-1', data: { teacherId: 'teacher-uid', gradeId: 'grade-1', status: 'active', deletedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
    ]);
    seedCollection('grades', [
      { id: 'grade-1', data: { name: 'Grade 1', nameAr: 'الصف الأول', stageId: 'stage-1', displayOrder: 1, deletedAt: null } },
    ]);
    seedCollection('stages', [
      { id: 'stage-1', data: { name: 'Primary', nameAr: 'ابتدائي', displayOrder: 1, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/teachers/my-grades/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/teachers/my-grades'));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { gradeIds: string[]; grades: Array<{ id: string; name: string }> } };
    expect(body.data.gradeIds).toHaveLength(1);
    expect(body.data.grades[0].name).toBe('الصف الأول');
  });
});

describe('GET /api/v1/teacher/leaderboard', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns leaderboard sorted by XP descending', async () => {
    seedCollection('xpAccounts', [
      { id: 'student-1', data: { totalXp: 500, level: 5 } },
      { id: 'student-2', data: { totalXp: 1000, level: 10 } },
      { id: 'student-3', data: { totalXp: 200, level: 2 } },
    ]);
    seedCollection('users', [
      { id: 'teacher-uid', data: { role: { role: 'teacher', grantedAt: '2024-01-01' }, fullName: 'Teacher', status: { status: 'active' }, isActive: true, deletedAt: null } },
      { id: 'student-1', data: { fullName: 'Student One', gradeId: 'grade-1', role: { role: 'student', grantedAt: '2024-01-01' }, deletedAt: null } },
      { id: 'student-2', data: { fullName: 'Student Two', gradeId: 'grade-1', role: { role: 'student', grantedAt: '2024-01-01' }, deletedAt: null } },
      { id: 'student-3', data: { fullName: 'Student Three', gradeId: 'grade-2', role: { role: 'student', grantedAt: '2024-01-01' }, deletedAt: null } },
    ]);

    const { GET } = await import('@/app/api/v1/teacher/leaderboard/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/teacher/leaderboard?gradeId=grade-1'));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { students: Array<{ fullName: string; xp: number }>; stats: { total: number; avgXp: number } } };
    expect(body.data.students).toHaveLength(2);
    expect(body.data.students[0].xp).toBe(1000);
    expect(body.data.students[0].fullName).toBe('Student Two');
    expect(body.data.students[1].xp).toBe(500);
    expect(body.data.stats.total).toBe(2);
    expect(body.data.stats.avgXp).toBe(750);
  });

  it('returns empty when no students in grade', async () => {
    const { GET } = await import('@/app/api/v1/teacher/leaderboard/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/teacher/leaderboard?gradeId=nonexistent'));
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { students: unknown[] } };
    expect(body.data.students).toEqual([]);
  });
});
