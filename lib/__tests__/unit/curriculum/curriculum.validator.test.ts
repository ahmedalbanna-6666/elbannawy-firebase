import { describe, it, expect } from '@jest/globals';
import {
  CreateAcademicYearInputSchema,
  UpdateAcademicYearInputSchema,
  CreateAcademicTermInputSchema,
  UpdateAcademicTermInputSchema,
  CurriculumFilterSchema,
  CurriculumIdSchema,
} from '../../../repositories/validators/curriculum.validator';

describe('CreateAcademicYearInputSchema', () => {
  const validInput = {
    id: 'year-1',
    educationalSystemId: 'GENERAL',
    name: '2025-2026',
    nameAr: '2025/2026',
    startDate: '2025-09-01',
    endDate: '2026-06-30',
  };

  it('accepts valid input', () => {
    const result = CreateAcademicYearInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing startDate', () => {
    const result = CreateAcademicYearInputSchema.safeParse({ ...validInput, startDate: undefined });
    expect(result.success).toBe(false);
  });

  it('defaults isCurrent to false', () => {
    const result = CreateAcademicYearInputSchema.parse(validInput);
    expect(result.isCurrent).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = CreateAcademicYearInputSchema.parse(validInput);
    expect(result.isActive).toBe(true);
  });
});

describe('UpdateAcademicYearInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateAcademicYearInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = UpdateAcademicYearInputSchema.safeParse({ name: 'Updated Year' });
    expect(result.success).toBe(true);
  });

  it('accepts isCurrent toggle', () => {
    const result = UpdateAcademicYearInputSchema.safeParse({ isCurrent: true });
    expect(result.success).toBe(true);
  });
});

describe('CreateAcademicTermInputSchema', () => {
  const validInput = {
    id: 'term-1',
    academicYearId: 'year-1',
    name: 'First Term',
    nameAr: 'الترم الأول',
    order: 1,
    startDate: '2025-09-01',
    endDate: '2026-01-31',
  };

  it('accepts valid input', () => {
    const result = CreateAcademicTermInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing academicYearId', () => {
    const result = CreateAcademicTermInputSchema.safeParse({ ...validInput, academicYearId: undefined });
    expect(result.success).toBe(false);
  });

  it('defaults isCurrent to false', () => {
    const result = CreateAcademicTermInputSchema.parse(validInput);
    expect(result.isCurrent).toBe(false);
  });
});

describe('UpdateAcademicTermInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateAcademicTermInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts isCurrent toggle', () => {
    const result = UpdateAcademicTermInputSchema.safeParse({ isCurrent: true });
    expect(result.success).toBe(true);
  });
});

describe('CurriculumFilterSchema', () => {
  it('accepts empty filter', () => {
    const result = CurriculumFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts educationalSystemId filter', () => {
    const result = CurriculumFilterSchema.safeParse({ educationalSystemId: 'GENERAL' });
    expect(result.success).toBe(true);
  });

  it('accepts isActive filter', () => {
    const result = CurriculumFilterSchema.safeParse({ isActive: true });
    expect(result.success).toBe(true);
  });
});

describe('CurriculumIdSchema', () => {
  it('accepts non-empty string', () => {
    const result = CurriculumIdSchema.safeParse('test-id');
    expect(result.success).toBe(true);
  });

  it('rejects empty string', () => {
    const result = CurriculumIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
