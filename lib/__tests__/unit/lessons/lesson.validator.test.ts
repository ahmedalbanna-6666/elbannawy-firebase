import { describe, it, expect } from '@jest/globals';
import {
  CreateLessonInputSchema,
  UpdateLessonInputSchema,
  LessonFilterSchema,
  LessonIdSchema,
  ChangeOrderSchema,
} from '../../../repositories/validators/lesson.validator';

describe('CreateLessonInputSchema', () => {
  const validInput = {
    id: 'lesson-1',
    unitId: 'unit-1',
    title: 'Lesson 1: Hello World',
    slug: 'lesson-1-hello-world',
    displayOrder: 1,
  };

  it('accepts valid input', () => {
    const result = CreateLessonInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = CreateLessonInputSchema.safeParse({
      ...validInput,
      description: 'Introduction lesson',
      status: 'published',
      isPublished: true,
      isVisible: false,
      estimatedDuration: 30,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty unitId', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, unitId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title too long', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, title: 'a'.repeat(301) });
    expect(result.success).toBe(false);
  });

  it('rejects empty slug', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, slug: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid slug format', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, slug: 'Invalid Slug!' });
    expect(result.success).toBe(false);
  });

  it('rejects negative displayOrder', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, displayOrder: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('defaults status to draft', () => {
    const result = CreateLessonInputSchema.parse(validInput);
    expect(result.status).toBe('draft');
  });

  it('defaults isPublished to false', () => {
    const result = CreateLessonInputSchema.parse(validInput);
    expect(result.isPublished).toBe(false);
  });

  it('defaults isVisible to true', () => {
    const result = CreateLessonInputSchema.parse(validInput);
    expect(result.isVisible).toBe(true);
  });

  it('rejects estimatedDuration less than 1', () => {
    const result = CreateLessonInputSchema.safeParse({ ...validInput, estimatedDuration: 0 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateLessonInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateLessonInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = UpdateLessonInputSchema.safeParse({ title: 'Updated Lesson' });
    expect(result.success).toBe(true);
  });

  it('rejects title too long', () => {
    const result = UpdateLessonInputSchema.safeParse({ title: 'a'.repeat(301) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid slug', () => {
    const result = UpdateLessonInputSchema.safeParse({ slug: 'Invalid Slug!' });
    expect(result.success).toBe(false);
  });

  it('rejects negative displayOrder', () => {
    const result = UpdateLessonInputSchema.safeParse({ displayOrder: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts displayOrder update', () => {
    const result = UpdateLessonInputSchema.safeParse({ displayOrder: 2 });
    expect(result.success).toBe(true);
  });

  it('accepts status update', () => {
    const result = UpdateLessonInputSchema.safeParse({ status: 'published' });
    expect(result.success).toBe(true);
  });

  it('accepts isPublished update', () => {
    const result = UpdateLessonInputSchema.safeParse({ isPublished: true });
    expect(result.success).toBe(true);
  });

  it('accepts isVisible update', () => {
    const result = UpdateLessonInputSchema.safeParse({ isVisible: false });
    expect(result.success).toBe(true);
  });

  it('accepts estimatedDuration update', () => {
    const result = UpdateLessonInputSchema.safeParse({ estimatedDuration: 45 });
    expect(result.success).toBe(true);
  });
});

describe('LessonFilterSchema', () => {
  it('accepts empty filter', () => {
    const result = LessonFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts unitId filter', () => {
    const result = LessonFilterSchema.safeParse({ unitId: 'unit-1' });
    expect(result.success).toBe(true);
  });

  it('accepts status filter', () => {
    const result = LessonFilterSchema.safeParse({ status: 'published' });
    expect(result.success).toBe(true);
  });

  it('accepts isPublished filter', () => {
    const result = LessonFilterSchema.safeParse({ isPublished: true });
    expect(result.success).toBe(true);
  });

  it('accepts isVisible filter', () => {
    const result = LessonFilterSchema.safeParse({ isVisible: false });
    expect(result.success).toBe(true);
  });

  it('accepts search filter', () => {
    const result = LessonFilterSchema.safeParse({ search: 'hello' });
    expect(result.success).toBe(true);
  });
});

describe('LessonIdSchema', () => {
  it('accepts valid id', () => {
    const result = LessonIdSchema.safeParse('lesson-1');
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = LessonIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('ChangeOrderSchema', () => {
  it('accepts valid displayOrder', () => {
    const result = ChangeOrderSchema.safeParse({ displayOrder: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects negative displayOrder', () => {
    const result = ChangeOrderSchema.safeParse({ displayOrder: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer', () => {
    const result = ChangeOrderSchema.safeParse({ displayOrder: 1.5 });
    expect(result.success).toBe(false);
  });
});
