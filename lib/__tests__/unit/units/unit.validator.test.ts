import { describe, it, expect } from '@jest/globals';
import {
  CreateUnitInputSchema,
  UpdateUnitInputSchema,
  UnitFilterSchema,
  UnitIdSchema,
} from '../../../repositories/validators/unit.validator';

describe('CreateUnitInputSchema', () => {
  const validInput = {
    id: 'unit-1',
    academicTermId: 'term-1',
    name: 'Unit 1: Greetings',
    nameAr: 'الوحدة الأولى: التحيات',
    order: 1,
  };

  it('accepts valid input', () => {
    const result = CreateUnitInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts optional description, isActive, isPremium, published', () => {
    const result = CreateUnitInputSchema.safeParse({
      ...validInput,
      description: 'Introduction unit',
      isActive: false,
      isPremium: true,
      published: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = CreateUnitInputSchema.safeParse({ ...validInput, id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty academicTermId', () => {
    const result = CreateUnitInputSchema.safeParse({ ...validInput, academicTermId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = CreateUnitInputSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty nameAr', () => {
    const result = CreateUnitInputSchema.safeParse({ ...validInput, nameAr: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = CreateUnitInputSchema.safeParse({ ...validInput, order: -1 });
    expect(result.success).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = CreateUnitInputSchema.parse(validInput);
    expect(result.isActive).toBe(true);
  });

  it('defaults isPremium to false', () => {
    const result = CreateUnitInputSchema.parse(validInput);
    expect(result.isPremium).toBe(false);
  });

  it('defaults published to false', () => {
    const result = CreateUnitInputSchema.parse(validInput);
    expect(result.published).toBe(false);
  });
});

describe('UpdateUnitInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateUnitInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = UpdateUnitInputSchema.safeParse({ name: 'Updated Unit' });
    expect(result.success).toBe(true);
  });

  it('rejects name that is too long', () => {
    const result = UpdateUnitInputSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects description that is too long', () => {
    const result = UpdateUnitInputSchema.safeParse({ description: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = UpdateUnitInputSchema.safeParse({ order: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts order update', () => {
    const result = UpdateUnitInputSchema.safeParse({ order: 2 });
    expect(result.success).toBe(true);
  });

  it('accepts isPremium update', () => {
    const result = UpdateUnitInputSchema.safeParse({ isPremium: true });
    expect(result.success).toBe(true);
  });

  it('accepts published update', () => {
    const result = UpdateUnitInputSchema.safeParse({ published: true });
    expect(result.success).toBe(true);
  });
});

describe('UnitFilterSchema', () => {
  it('accepts empty filter', () => {
    const result = UnitFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts academicTermId filter', () => {
    const result = UnitFilterSchema.safeParse({ academicTermId: 'term-1' });
    expect(result.success).toBe(true);
  });

  it('accepts isActive filter', () => {
    const result = UnitFilterSchema.safeParse({ isActive: true });
    expect(result.success).toBe(true);
  });

  it('accepts isPremium filter', () => {
    const result = UnitFilterSchema.safeParse({ isPremium: true });
    expect(result.success).toBe(true);
  });

  it('accepts published filter', () => {
    const result = UnitFilterSchema.safeParse({ published: false });
    expect(result.success).toBe(true);
  });

  it('accepts search filter', () => {
    const result = UnitFilterSchema.safeParse({ search: 'greetings' });
    expect(result.success).toBe(true);
  });
});

describe('UnitIdSchema', () => {
  it('accepts valid id', () => {
    const result = UnitIdSchema.safeParse('unit-1');
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = UnitIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
