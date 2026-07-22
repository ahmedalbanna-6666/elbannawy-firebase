import { LessonProgressFirestoreMapper } from '../../../repositories/activities/lesson-progress-firestore-mapper';

describe('LessonProgressFirestoreMapper', () => {
  const mockDoc = {
    id: 'progress-001',
    studentId: 'student-001',
    lessonId: 'lesson-001',
    unitId: 'unit-001',
    status: 'in_progress',
    completedActivities: 3,
    totalActivities: 5,
    percentage: 60,
    score: 80,
    maxScore: 100,
    lastActivityId: 'act-003',
    startedAt: '2024-01-01T00:00:00Z',
    completedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T01:00:00Z',
  };

  describe('toDomain', () => {
    it('maps firestore doc to progress entity', () => {
      const entity = LessonProgressFirestoreMapper.toDomain(mockDoc);
      expect(entity.id).toBe('progress-001');
      expect(entity.studentId).toBe('student-001');
      expect(entity.lessonId).toBe('lesson-001');
      expect(entity.status).toBe('in_progress');
      expect(entity.completedActivities).toBe(3);
      expect(entity.percentage).toBe(60);
    });

    it('uses defaults for missing fields', () => {
      const entity = LessonProgressFirestoreMapper.toDomain({
        id: 'p-1', studentId: 's-1', lessonId: 'l-1', unitId: 'u-1',
        status: 'not_started', completedActivities: 0, totalActivities: 0,
        percentage: 0, createdAt: '', updatedAt: '',
      });
      expect(entity.status).toBe('not_started');
      expect(entity.completedActivities).toBe(0);
      expect(entity.percentage).toBe(0);
    });
  });

  describe('toCreate', () => {
    it('maps create input to firestore document', () => {
      const doc = LessonProgressFirestoreMapper.toCreate({
        id: 'progress-002',
        studentId: 'student-001',
        lessonId: 'lesson-001',
        unitId: 'unit-001',
        totalActivities: 5,
      });
      expect(doc.status).toBe('not_started');
      expect(doc.completedActivities).toBe(0);
      expect(doc.percentage).toBe(0);
    });
  });
});
