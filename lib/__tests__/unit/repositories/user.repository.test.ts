import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserRepository } from '../../../repositories/user/user.repository';

jest.mock('../../../repositories/transactions/transaction-manager', () => ({
  TransactionManager: {
    getInstance: jest.fn(() => ({
      runTransaction: jest.fn((fn: Function) => fn({ firestore: { collection: jest.fn() } })),
      generateTransactionId: jest.fn(() => 'txn-123'),
    })),
  },
}));

jest.mock('../../../repositories/query-builder', () => ({
  QueryBuilder: jest.fn().mockImplementation(() => ({
    withFilter: jest.fn().mockReturnThis(),
    withOrderBy: jest.fn().mockReturnThis(),
    withLimit: jest.fn().mockReturnThis(),
    withCursor: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({
      ok: true,
      value: {
        items: [],
        nextCursor: null,
      },
    }),
  })),
}));

jest.mock('../../../repositories/base/base-repository', () => {
  const actual = jest.requireActual('../../../repositories/base/base-repository') as Record<string, unknown>;
  return {
    ...actual,
    BaseRepository: class MockBaseRepository {
      collection = 'users';
      transactionManager = {
        runTransaction: jest.fn(),
        generateTransactionId: jest.fn(() => 'txn-123'),
      };

      async create(data: unknown) {
        return { ok: true, value: data };
      }

      async getById(_id: string) {
        return { ok: true, value: null };
      }

      async update(_id: string, _data: unknown, _expectedVersion: number) {
        return {
          ok: true,
          value: {
            id: _id,
            fullName: 'Test User',
            email: null,
            englishName: null,
            mobileNumber: '+201234567890',
            parentMobile: null,
            role: { role: 'student', grantedAt: new Date().toISOString() },
            status: { status: 'active', reason: null },
            educationalSystemId: null,
            stageId: null,
            gradeId: null,
            academicYearId: null,
            termId: null,
            governorate: null,
            school: null,
            avatarUrl: null,
            jobTitle: null,
            createdBy: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            schemaVersion: 1,
            deletedAt: null,
          },
        };
      }

      async archive(_id: string) {
        return { ok: true, value: undefined };
      }

      async restore(_id: string) {
        return { ok: true, value: undefined };
      }

      async exists(_id: string) {
        return true;
      }
    },
  };
});

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
  });

  describe('createUser', () => {
    it('creates a user successfully', async () => {
      const result = await repository.createUser({
        id: 'user-1',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
      });

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for missing id', async () => {
      const result = await repository.createUser({
        id: '',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns INVALID_INPUT for invalid role', async () => {
      const result = await repository.createUser({
        id: 'user-2',
        role: 'invalid' as any,
        fullName: 'Test User',
        mobileNumber: '+201234567890',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns INVALID_INPUT for invalid mobile', async () => {
      const result = await repository.createUser({
        id: 'user-3',
        role: 'teacher',
        fullName: 'Test User',
        mobileNumber: 'not-a-number',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('getUserById', () => {
    it('returns INVALID_INPUT for empty id', async () => {
      const result = await repository.getUserById('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent user', async () => {
      jest.spyOn(repository as any, 'getById').mockResolvedValueOnce({
        ok: true,
        value: null,
      });

      const result = await repository.getUserById('non-existent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('findUserByMobile', () => {
    it('returns INVALID_INPUT for empty mobile', async () => {
      const result = await repository.findUserByMobile('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns null for non-existent mobile', async () => {
      const result = await repository.findUserByMobile('+201111111111');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('findUserByEmail', () => {
    it('returns INVALID_INPUT for empty email', async () => {
      const result = await repository.findUserByEmail('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns null for non-existent email', async () => {
      const result = await repository.findUserByEmail('none@test.com');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('listUsers', () => {
    it('returns empty list when no users match', async () => {
      const result = await repository.listUsers({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
        expect(result.value.nextCursor).toBeNull();
      }
    });

    it('validates filter', async () => {
      const result = await repository.listUsers(
        { role: ['invalid' as any] },
        { limit: 20 },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('validates page query', async () => {
      const result = await repository.listUsers({}, { limit: 0 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('softDeleteUser', () => {
    it('soft deletes user successfully', async () => {
      const result = await repository.softDeleteUser('user-1', 'req-1');
      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.softDeleteUser('user-1', '');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('changeAccountStatus', () => {
    it('changes status successfully', async () => {
      const result = await repository.changeAccountStatus(
        'user-1',
        { status: 'suspended', reason: 'test' },
        'req-1',
      );
      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for invalid status', async () => {
      const result = await repository.changeAccountStatus(
        'user-1',
        { status: 'invalid' as any },
        'req-1',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('changeRole', () => {
    it('changes role successfully', async () => {
      const result = await repository.changeRole(
        'user-1',
        { role: 'teacher', grantedAt: new Date().toISOString() },
        'req-1',
      );
      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for invalid role', async () => {
      const result = await repository.changeRole(
        'user-1',
        { role: 'invalid' as any, grantedAt: new Date().toISOString() },
        'req-1',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('restoreUser', () => {
    it('restores user successfully', async () => {
      const result = await repository.restoreUser('user-1', 'req-1');
      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.restoreUser('user-1', '');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const result = await repository.updateProfile(
        'user-1',
        { fullName: 'Updated Name' },
        1,
      );
      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty id', async () => {
      const result = await repository.updateProfile(
        '',
        { fullName: 'Updated Name' },
        1,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });
});
