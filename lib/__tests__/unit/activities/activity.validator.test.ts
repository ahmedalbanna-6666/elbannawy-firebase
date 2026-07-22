import { ActivityValidator } from '../../../repositories/validators/activity.validator';

describe('ActivityValidator', () => {
  const validator = new ActivityValidator();
  const validCreate = {
    id: 'act-001',
    lessonId: 'lesson-001',
    type: 'multiple-choice',
    title: 'Choose the correct answer',
    displayOrder: 1,
    config: { schemaVersion: 1, data: { options: ['A', 'B', 'C'] } },
  };

  describe('validateCreate', () => {
    it('returns no errors for valid input', () => {
      const errors = validator.validateCreate(validCreate);
      expect(errors).toHaveLength(0);
    });

    it('requires id', () => {
      const errors = validator.validateCreate({ ...validCreate, id: '' });
      expect(errors).toContain('Activity ID is required');
    });

    it('requires lessonId', () => {
      const errors = validator.validateCreate({ ...validCreate, lessonId: '' });
      expect(errors).toContain('Lesson ID is required');
    });

    it('requires type', () => {
      const errors = validator.validateCreate({ ...validCreate, type: '' });
      expect(errors).toContain('Activity type is required');
    });

    it('requires title', () => {
      const errors = validator.validateCreate({ ...validCreate, title: '' });
      expect(errors).toContain('Title is required');
    });

    it('requires non-negative displayOrder', () => {
      const errors = validator.validateCreate({ ...validCreate, displayOrder: -1 });
      expect(errors).toContain('Number must be greater than or equal to 0');
    });

    it('requires config', () => {
      const errors = validator.validateCreate({ ...validCreate, config: undefined as any });
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('requires schemaVersion >= 1', () => {
      const errors = validator.validateCreate({ ...validCreate, config: { schemaVersion: 0, data: {} } });
      expect(errors).toContain('Number must be greater than or equal to 1');
    });

    it('requires timeLimit to be non-negative', () => {
      const errors = validator.validateCreate({ ...validCreate, timeLimit: -5 });
      expect(errors).toContain('Number must be greater than or equal to 0');
    });

    it('requires maxAttempts >= 1', () => {
      const errors = validator.validateCreate({ ...validCreate, maxAttempts: 0 });
      expect(errors).toContain('Number must be greater than or equal to 1');
    });

    it('returns multiple errors for invalid input', () => {
      const errors = validator.validateCreate({} as any);
      expect(errors.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('validateUpdate', () => {
    it('returns no errors for empty update', () => {
      const errors = validator.validateUpdate({});
      expect(errors).toHaveLength(0);
    });

    it('validates displayOrder', () => {
      const errors = validator.validateUpdate({ displayOrder: -1 });
      expect(errors).toContain('Number must be greater than or equal to 0');
    });

    it('validates timeLimit', () => {
      const errors = validator.validateUpdate({ timeLimit: -1 });
      expect(errors).toContain('Number must be greater than or equal to 0');
    });

    it('validates maxAttempts', () => {
      const errors = validator.validateUpdate({ maxAttempts: 0 });
      expect(errors).toContain('Number must be greater than or equal to 1');
    });

    it('validates config', () => {
      const errors = validator.validateUpdate({ config: { schemaVersion: 0, data: {} } });
      expect(errors).toContain('Number must be greater than or equal to 1');
    });
  });

  describe('validateFilter', () => {
    it('returns no errors for valid status', () => {
      expect(validator.validateFilter({ status: 'published' })).toHaveLength(0);
      expect(validator.validateFilter({ status: 'draft' })).toHaveLength(0);
      expect(validator.validateFilter({ status: 'archived' })).toHaveLength(0);
    });

    it('rejects invalid status', () => {
      const errors = validator.validateFilter({ status: 'invalid' as any });
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });
});
