import { describe, it, expect } from '@jest/globals';
import {
  CreateEducationalSystemInputSchema,
  UpdateEducationalSystemInputSchema,
  CreateStageInputSchema,
  UpdateStageInputSchema,
  CreateGradeInputSchema,
  UpdateGradeInputSchema,
  CreateAcademicYearInputSchema,
  UpdateAcademicYearInputSchema,
  CreateAcademicTermInputSchema,
  UpdateAcademicTermInputSchema,
  CurriculumFilterSchema,
  CurriculumIdSchema,
} from '../../../repositories/validators/curriculum.validator';

describe('CreateEducationalSystemInputSchema', () => {
  const validInput = {
    id: 'sys-1',
    name: 'Egyptian National',
    nameAr: 'مصري وطني',
  };

  it('accepts valid input', () => {
    const result = CreateEducationalSystemInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts optional description and isActive', () => {
    const result = CreateEducationalSystemInputSchema.safeParse({
      ...validInput,
      description: 'Test system',
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = CreateEducationalSystemInputSchema.safeParse({ ...validInput, id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = CreateEducationalSystemInputSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty nameAr', () => {
    const result = CreateEducationalSystemInputSchema.safeParse({ ...validInput, nameAr: '' });
    expect(result.success).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = CreateEducationalSystemInputSchema.parse(validInput);
    expect(result.isActive).toBe(true);
  });
});

describe('UpdateEducationalSystemInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateEducationalSystemInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = UpdateEducationalSystemInputSchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('rejects name that is too long', () => {
    const result = UpdateEducationalSystemInputSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects description that is too long', () => {
    const result = UpdateEducationalSystemInputSchema.safeParse({ description: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe('CreateStageInputSchema', () => {
  const validInput = {
    id: 'stage-1',
    educationalSystemId: 'sys-1',
    name: 'Primary',
    nameAr: 'ابتدائي',
    order: 1,
  };

  it('accepts valid input', () => {
    const result = CreateStageInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = CreateStageInputSchema.safeParse({ ...validInput, id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing educationalSystemId', () => {
    const result = CreateStageInputSchema.safeParse({ ...validInput, educationalSystemId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = CreateStageInputSchema.safeParse({ ...validInput, order: -1 });
    expect(result.success).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = CreateStageInputSchema.parse(validInput);
    expect(result.isActive).toBe(true);
  });
});

describe('UpdateStageInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateStageInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts order update', () => {
    const result = UpdateStageInputSchema.safeParse({ order: 2 });
    expect(result.success).toBe(true);
  });

  it('rejects negative order', () => {
    const result = UpdateStageInputSchema.safeParse({ order: -1 });
    expect(result.success).toBe(false);
  });
});

describe('CreateGradeInputSchema', () => {
  const validInput = {
    id: 'grade-1',
    educationalSystemId: 'sys-1',
    stageId: 'stage-1',
    name: 'Grade 1',
    nameAr: 'الصف الأول',
    order: 1,
  };

  it('accepts valid input', () => {
    const result = CreateGradeInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty stageId', () => {
    const result = CreateGradeInputSchema.safeParse({ ...validInput, stageId: '' });
    expect(result.success).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = CreateGradeInputSchema.parse(validInput);
    expect(result.isActive).toBe(true);
  });
});

describe('UpdateGradeInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateGradeInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('CreateAcademicYearInputSchema', () => {
  const validInput = {
    id: 'year-1',
    educationalSystemId: 'sys-1',
    name: '2025-2026',
    nameAr: '2025-2026',
    startDate: '2025-09-01',
    endDate: '2026-06-30',
  };

  it('accepts valid input', () => {
    const result = CreateAcademicYearInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing startDate', () => {
    const result = CreateAcademicYearInputSchema.safeParse({ ...validInput, startDate: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing endDate', () => {
    const result = CreateAcademicYearInputSchema.safeParse({ ...validInput, endDate: '' });
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
});

describe('CreateAcademicTermInputSchema', () => {
  const validInput = {
    id: 'term-1',
    academicYearId: 'year-1',
    name: 'First Term',
    nameAr: 'الفصل الأول',
    order: 1,
    startDate: '2025-09-01',
    endDate: '2026-01-31',
  };

  it('accepts valid input', () => {
    const result = CreateAcademicTermInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing academicYearId', () => {
    const result = CreateAcademicTermInputSchema.safeParse({ ...validInput, academicYearId: '' });
    expect(result.success).toBe(false);
  });

  it('defaults isCurrent to false', () => {
    const result = CreateAcademicTermInputSchema.parse(validInput);
    expect(result.isCurrent).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = CreateAcademicTermInputSchema.parse(validInput);
    expect(result.isActive).toBe(true);
  });
});

describe('UpdateAcademicTermInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateAcademicTermInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('CurriculumFilterSchema', () => {
  it('accepts empty filter', () => {
    const result = CurriculumFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts educationalSystemId filter', () => {
    const result = CurriculumFilterSchema.safeParse({ educationalSystemId: 'sys-1' });
    expect(result.success).toBe(true);
  });

  it('accepts isActive filter', () => {
    const result = CurriculumFilterSchema.safeParse({ isActive: true });
    expect(result.success).toBe(true);
  });

  it('accepts isCurrent filter', () => {
    const result = CurriculumFilterSchema.safeParse({ isCurrent: true });
    expect(result.success).toBe(true);
  });

  it('accepts search filter', () => {
    const result = CurriculumFilterSchema.safeParse({ search: 'primary' });
    expect(result.success).toBe(true);
  });
});

describe('CurriculumIdSchema', () => {
  it('accepts valid id', () => {
    const result = CurriculumIdSchema.safeParse('sys-1');
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = CurriculumIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
