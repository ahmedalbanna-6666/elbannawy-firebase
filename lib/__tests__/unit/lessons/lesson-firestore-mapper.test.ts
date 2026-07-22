import { describe, it, expect } from '@jest/globals';
import { LessonFirestoreMapper, LessonFirestoreDoc } from '../../../repositories/lessons/lesson-firestore-mapper';
import { Timestamp } from 'firebase-admin/firestore';

const ts = '2026-01-01T00:00:00.000Z';
const fbTs = Timestamp.fromDate(new Date(ts));

const mockLessonDoc: LessonFirestoreDoc = {
  id: 'lesson-1',
  unitId: 'unit-1',
  title: 'Lesson 1: Hello World',
  slug: 'lesson-1-hello-world',
  description: 'Introduction to basic greetings',
  displayOrder: 1,
  status: 'published',
  isPublished: true,
  isVisible: true,
  estimatedDuration: 30,
  createdAt: fbTs,
  updatedAt: fbTs,
  schemaVersion: 1,
  deletedAt: null,
};

describe('LessonFirestoreMapper', () => {
  describe('toDomain', () => {
    it('maps lesson doc to domain entity', () => {
      const domain = LessonFirestoreMapper.toDomain(mockLessonDoc);

      expect(domain.id).toBe('lesson-1');
      expect(domain.unitId).toBe('unit-1');
      expect(domain.title).toBe('Lesson 1: Hello World');
      expect(domain.slug).toBe('lesson-1-hello-world');
      expect(domain.description).toBe('Introduction to basic greetings');
      expect(domain.displayOrder).toBe(1);
      expect(domain.status).toBe('published');
      expect(domain.isPublished).toBe(true);
      expect(domain.isVisible).toBe(true);
      expect(domain.estimatedDuration).toBe(30);
      expect(domain.createdAt).toBe(ts);
      expect(domain.updatedAt).toBe(ts);
      expect(domain.schemaVersion).toBe(1);
      expect(domain.deletedAt).toBeNull();
    });

    it('handles null description', () => {
      const domain = LessonFirestoreMapper.toDomain({
        ...mockLessonDoc,
        description: null,
      });

      expect(domain.description).toBeUndefined();
    });

    it('handles null estimatedDuration', () => {
      const domain = LessonFirestoreMapper.toDomain({
        ...mockLessonDoc,
        estimatedDuration: null,
      });

      expect(domain.estimatedDuration).toBeUndefined();
    });

    it('handles null deletedAt', () => {
      const domain = LessonFirestoreMapper.toDomain(mockLessonDoc);

      expect(domain.deletedAt).toBeNull();
    });

    it('handles string timestamps', () => {
      const doc: LessonFirestoreDoc = {
        ...mockLessonDoc,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      const domain = LessonFirestoreMapper.toDomain(doc);

      expect(domain.createdAt).toBe(ts);
      expect(domain.updatedAt).toBe(ts);
    });

    it('handles string deletedAt', () => {
      const doc: LessonFirestoreDoc = {
        ...mockLessonDoc,
        deletedAt: ts,
      };
      const domain = LessonFirestoreMapper.toDomain(doc);

      expect(domain.deletedAt).toBe(ts);
    });
  });

  describe('toSummary', () => {
    it('maps lesson doc to summary', () => {
      const summary = LessonFirestoreMapper.toSummary(mockLessonDoc);

      expect(summary.id).toBe('lesson-1');
      expect(summary.unitId).toBe('unit-1');
      expect(summary.title).toBe('Lesson 1: Hello World');
      expect(summary.slug).toBe('lesson-1-hello-world');
      expect(summary.displayOrder).toBe(1);
      expect(summary.status).toBe('published');
      expect(summary.isPublished).toBe(true);
      expect(summary.isVisible).toBe(true);
      expect(summary.estimatedDuration).toBe(30);
      expect(summary.createdAt).toBe(ts);
    });
  });

  describe('SCHEMA_VERSION', () => {
    it('is set to 1', () => {
      expect(LessonFirestoreMapper.SCHEMA_VERSION).toBe(1);
    });
  });
});
