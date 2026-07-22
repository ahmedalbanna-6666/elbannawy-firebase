import { ActivityFirestoreMapper } from '../../../repositories/activities/activity-firestore-mapper';

describe('ActivityFirestoreMapper', () => {
  const mockDoc = {
    id: 'act-001',
    lessonId: 'lesson-001',
    type: 'multiple-choice',
    title: 'Choose the best answer',
    subtitle: 'Vocabulary quiz',
    instructions: 'Pick one',
    displayOrder: 1,
    config: { schemaVersion: 1, data: { options: ['A', 'B', 'C'] } },
    status: 'published',
    isRequired: true,
    isScorable: true,
    isPractice: false,
    timeLimit: 60,
    maxAttempts: 3,
    retryable: true,
    prerequisiteActivityIds: ['act-000'],
    metadata: {
      estimatedDuration: 120,
      skill: 'vocabulary',
      difficulty: 'intermediate',
      tags: ['vocab', 'quiz'],
      bloomLevel: 'remember',
      aiGenerated: false,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    schemaVersion: 1,
    deletedAt: null,
  };

  describe('toDomain', () => {
    it('maps firestore doc to activity entity', () => {
      const entity = ActivityFirestoreMapper.toDomain(mockDoc);
      expect(entity.id).toBe('act-001');
      expect(entity.lessonId).toBe('lesson-001');
      expect(entity.type).toBe('multiple-choice');
      expect(entity.title).toBe('Choose the best answer');
      expect(entity.subtitle).toBe('Vocabulary quiz');
      expect(entity.displayOrder).toBe(1);
      expect(entity.status).toBe('published');
      expect(entity.isRequired).toBe(true);
      expect(entity.isScorable).toBe(true);
      expect(entity.metadata.tags).toEqual(['vocab', 'quiz']);
    });

    it('uses defaults for missing optional fields', () => {
      const entity = ActivityFirestoreMapper.toDomain({
        id: 'act-002', lessonId: 'l-1', type: 't', title: 'T', displayOrder: 0,
        config: { schemaVersion: 1, data: {} }, status: 'draft', isRequired: true,
        isScorable: true, isPractice: false, retryable: false, prerequisiteActivityIds: [],
        metadata: { tags: [], aiGenerated: false },
        createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null,
      });
      expect(entity.status).toBe('draft');
      expect(entity.isRequired).toBe(true);
      expect(entity.isScorable).toBe(true);
      expect(entity.isPractice).toBe(false);
      expect(entity.retryable).toBe(false);
      expect(entity.prerequisiteActivityIds).toEqual([]);
      expect(entity.metadata.tags).toEqual([]);
      expect(entity.metadata.aiGenerated).toBe(false);
    });
  });

  describe('toCreate', () => {
    it('maps create input to firestore document', () => {
      const doc = ActivityFirestoreMapper.toCreate({
        id: 'act-001',
        lessonId: 'lesson-001',
        type: 'multiple-choice',
        title: 'Test',
        displayOrder: 1,
        config: { schemaVersion: 1, data: {} },
      });
      expect(doc.status).toBe('draft');
      expect(doc.isRequired).toBe(true);
      expect(doc.deletedAt).toBeNull();
      expect(doc.schemaVersion).toBe(1);
    });
  });
});
