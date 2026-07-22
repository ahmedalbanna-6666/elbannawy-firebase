import { StudentAttemptFirestoreMapper } from '../../../repositories/activities/student-attempt-firestore-mapper';

describe('StudentAttemptFirestoreMapper', () => {
  const mockDoc = {
    id: 'attempt-001',
    activityId: 'act-001',
    studentId: 'student-001',
    lessonId: 'lesson-001',
    unitId: 'unit-001',
    attemptNumber: 1,
    answer: { selected: 'A' },
    score: 80,
    maxScore: 100,
    percentage: 80,
    passed: true,
    feedback: 'Good job',
    correctAnswer: { selected: 'A' },
    startedAt: '2024-01-01T00:00:00Z',
    submittedAt: '2024-01-01T01:00:00Z',
    timeLimit: 60,
    timeSpent: 45,
    status: 'graded',
    gradingMethod: 'auto',
    state: { questionIndex: 1 },
    activitySchemaVersion: 1,
    metadata: { ipAddress: '192.168.1.1', userAgent: 'test-agent' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T01:00:00Z',
  };

  describe('toDomain', () => {
    it('maps firestore doc to attempt entity', () => {
      const entity = StudentAttemptFirestoreMapper.toDomain(mockDoc);
      expect(entity.id).toBe('attempt-001');
      expect(entity.activityId).toBe('act-001');
      expect(entity.studentId).toBe('student-001');
      expect(entity.attemptNumber).toBe(1);
      expect(entity.score).toBe(80);
      expect(entity.passed).toBe(true);
      expect(entity.status).toBe('graded');
      expect(entity.metadata.ipAddress).toBe('192.168.1.1');
    });

    it('uses defaults for missing fields', () => {
      const entity = StudentAttemptFirestoreMapper.toDomain({
        id: 'a-1', activityId: 'act-1', studentId: 's-1', lessonId: 'l-1', unitId: 'u-1',
        attemptNumber: 1, maxScore: 100, status: 'in_progress', gradingMethod: 'auto',
        activitySchemaVersion: 1, metadata: {},
        startedAt: '', createdAt: '', updatedAt: '',
      });
      expect(entity.status).toBe('in_progress');
      expect(entity.gradingMethod).toBe('auto');
    });
  });

  describe('toCreate', () => {
    it('maps create input to firestore document', () => {
      const doc = StudentAttemptFirestoreMapper.toCreate({
        id: 'attempt-002',
        activityId: 'act-001',
        studentId: 'student-001',
        lessonId: 'lesson-001',
        unitId: 'unit-001',
        attemptNumber: 1,
        maxScore: 100,
        gradingMethod: 'auto',
        activitySchemaVersion: 1,
      });
      expect(doc.status).toBe('in_progress');
      expect(doc.startedAt).toBeDefined();
    });
  });
});
