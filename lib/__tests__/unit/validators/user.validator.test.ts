import { describe, it, expect } from '@jest/globals';
import {
  CreateUserInputSchema,
  UpdateProfileInputSchema,
  ChangeStatusInputSchema,
  ChangeRoleInputSchema,
  UserFilterSchema,
  PageQuerySchema,
  AppendLoginEventInputSchema,
} from '../../../repositories/validators/user.validator';

describe('CreateUserInputSchema', () => {
  const validInput = {
    id: 'user-123',
    role: 'student' as const,
    fullName: 'Ahmed Mohamed',
    mobileNumber: '+201234567890',
  };

  it('accepts valid input', () => {
    const result = CreateUserInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = CreateUserInputSchema.safeParse({ ...validInput, id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = CreateUserInputSchema.safeParse({ ...validInput, role: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty fullName', () => {
    const result = CreateUserInputSchema.safeParse({ ...validInput, fullName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid mobile number', () => {
    const result = CreateUserInputSchema.safeParse({ ...validInput, mobileNumber: '123' });
    expect(result.success).toBe(false);
  });

  it('accepts optional email', () => {
    const result = CreateUserInputSchema.safeParse({ ...validInput, email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = CreateUserInputSchema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = CreateUserInputSchema.parse(validInput);
    expect(result.isActive).toBe(true);
  });

  it('accepts all valid roles', () => {
    const roles = ['student', 'teacher', 'staff', 'secretary', 'support', 'administrator'] as const;
    for (const role of roles) {
      const result = CreateUserInputSchema.safeParse({ ...validInput, role });
      expect(result.success).toBe(true);
    }
  });

  it('rejects mobile number without country code', () => {
    const result = CreateUserInputSchema.safeParse({ ...validInput, mobileNumber: '01234567890' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateProfileInputSchema', () => {
  it('accepts empty input', () => {
    const result = UpdateProfileInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial name update', () => {
    const result = UpdateProfileInputSchema.safeParse({ fullName: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid mobile', () => {
    const result = UpdateProfileInputSchema.safeParse({ mobileNumber: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = UpdateProfileInputSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects fullName that is too long', () => {
    const result = UpdateProfileInputSchema.safeParse({ fullName: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('ChangeStatusInputSchema', () => {
  it('accepts valid status with reason', () => {
    const result = ChangeStatusInputSchema.safeParse({
      status: 'suspended',
      reason: 'Violation of terms',
      requestId: 'req-123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid status without reason', () => {
    const result = ChangeStatusInputSchema.safeParse({
      status: 'active',
      requestId: 'req-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = ChangeStatusInputSchema.safeParse({
      status: 'unknown',
      requestId: 'req-123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing requestId', () => {
    const result = ChangeStatusInputSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid account statuses', () => {
    const statuses = ['active', 'inactive', 'suspended', 'pending'] as const;
    for (const status of statuses) {
      const result = ChangeStatusInputSchema.safeParse({ status, requestId: 'req-1' });
      expect(result.success).toBe(true);
    }
  });
});

describe('ChangeRoleInputSchema', () => {
  it('accepts valid role', () => {
    const result = ChangeRoleInputSchema.safeParse({
      role: 'teacher',
      requestId: 'req-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = ChangeRoleInputSchema.safeParse({
      role: 'superadmin',
      requestId: 'req-123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing requestId', () => {
    const result = ChangeRoleInputSchema.safeParse({ role: 'teacher' });
    expect(result.success).toBe(false);
  });
});

describe('UserFilterSchema', () => {
  it('accepts empty filter', () => {
    const result = UserFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts role filter', () => {
    const result = UserFilterSchema.safeParse({ role: ['student', 'teacher'] });
    expect(result.success).toBe(true);
  });

  it('accepts isActive filter', () => {
    const result = UserFilterSchema.safeParse({ isActive: true });
    expect(result.success).toBe(true);
  });

  it('accepts gradeId filter', () => {
    const result = UserFilterSchema.safeParse({ gradeId: 'grade-1' });
    expect(result.success).toBe(true);
  });
});

describe('PageQuerySchema', () => {
  it('accepts valid page query', () => {
    const result = PageQuerySchema.safeParse({ limit: 20, cursor: 'cursor-1' });
    expect(result.success).toBe(true);
  });

  it('defaults limit to 20', () => {
    const result = PageQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it('rejects limit over 100', () => {
    const result = PageQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects limit under 1', () => {
    const result = PageQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AppendLoginEventInputSchema', () => {
  it('accepts valid login event', () => {
    const result = AppendLoginEventInputSchema.safeParse({
      eventType: 'login',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal login event', () => {
    const result = AppendLoginEventInputSchema.safeParse({ eventType: 'login' });
    expect(result.success).toBe(true);
  });

  it('rejects empty eventType', () => {
    const result = AppendLoginEventInputSchema.safeParse({ eventType: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing eventType', () => {
    const result = AppendLoginEventInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
