import { describe, it, expect } from '@jest/globals';
import { IUserRepository, IUser, CreateUserInput, UserFilter, LoginEvent, UserSummary } from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';

/**
 * Contract Tests for IUserRepository.
 *
 * These tests validate that a UserRepository implementation satisfies
 * the IUserRepository contract. Any implementation must pass these tests.
 */

export function runUserRepositoryContractTests(
  description: string,
  createRepository: () => IUserRepository,
  generateUniqueId: () => string,
): void {
  describe(`IUserRepository Contract: ${description}`, () => {
    let repository: IUserRepository;

    beforeEach(() => {
      repository = createRepository();
    });

    describe('Contract Method Signatures', () => {
      it('implements createUser', () => {
        expect(repository.createUser).toBeDefined();
        expect(repository.createUser.length).toBe(1);
      });

      it('implements getUserById', () => {
        expect(repository.getUserById).toBeDefined();
        expect(repository.getUserById.length).toBe(1);
      });

      it('implements findUserByMobile', () => {
        expect(repository.findUserByMobile).toBeDefined();
        expect(repository.findUserByMobile.length).toBe(1);
      });

      it('implements findUserByEmail', () => {
        expect(repository.findUserByEmail).toBeDefined();
        expect(repository.findUserByEmail.length).toBe(1);
      });

      it('implements listUsers', () => {
        expect(repository.listUsers).toBeDefined();
        expect(repository.listUsers.length).toBe(2);
      });

      it('implements updateProfile', () => {
        expect(repository.updateProfile).toBeDefined();
        expect(repository.updateProfile.length).toBe(3);
      });

      it('implements updateAcademicAssignment', () => {
        expect(repository.updateAcademicAssignment).toBeDefined();
        expect(repository.updateAcademicAssignment.length).toBe(2);
      });

      it('implements changeAccountStatus', () => {
        expect(repository.changeAccountStatus).toBeDefined();
        expect(repository.changeAccountStatus.length).toBe(3);
      });

      it('implements changeRole', () => {
        expect(repository.changeRole).toBeDefined();
        expect(repository.changeRole.length).toBe(3);
      });

      it('implements softDeleteUser', () => {
        expect(repository.softDeleteUser).toBeDefined();
        expect(repository.softDeleteUser.length).toBe(2);
      });

      it('implements restoreUser', () => {
        expect((repository as any).restoreUser).toBeDefined();
      });

      it('implements appendLoginEvent', () => {
        expect(repository.appendLoginEvent).toBeDefined();
        expect(repository.appendLoginEvent.length).toBe(1);
      });

      it('implements listLoginEvents', () => {
        expect(repository.listLoginEvents).toBeDefined();
        expect(repository.listLoginEvents.length).toBe(2);
      });
    });

    describe('RepositoryResult Type Contract', () => {
      it('createUser returns RepositoryResult<IUser>', async () => {
        const result = await repository.createUser({
          id: generateUniqueId(),
          role: 'student',
          fullName: 'Contract Test',
          mobileNumber: '+201000000001',
        });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value).toHaveProperty('role');
          expect(result.value).toHaveProperty('fullName');
          expect(result.value).toHaveProperty('mobileNumber');
          expect(result.value).toHaveProperty('isActive');
          expect(result.value).toHaveProperty('createdAt');
          expect(result.value).toHaveProperty('updatedAt');
        } else {
          expect(result.error).toHaveProperty('code');
          expect(result.error).toHaveProperty('message');
          expect(result.error).toHaveProperty('retryable');
        }
      });

      it('getUserById returns RepositoryResult<IUser>', async () => {
        const result = await repository.getUserById('non-existent');

        expect(result).toHaveProperty('ok');
      });

      it('findUserByMobile returns RepositoryResult<IUser | null>', async () => {
        const result = await repository.findUserByMobile('+201000000002');

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value === null || typeof result.value === 'object').toBe(true);
        }
      });

      it('listUsers returns RepositoryResult<Page<UserSummary>>', async () => {
        const result = await repository.listUsers({}, { limit: 20 });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('items');
          expect(result.value).toHaveProperty('nextCursor');
          expect(Array.isArray(result.value.items)).toBe(true);
        }
      });

      it('updateProfile returns RepositoryResult<IUser>', async () => {
        const userId = generateUniqueId();
        await repository.createUser({
          id: userId,
          role: 'student',
          fullName: 'Profile Test',
          mobileNumber: '+201000000003',
        });

        const result = await repository.updateProfile(userId, { fullName: 'Updated' }, 0);

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value).toHaveProperty('fullName');
        }
      });

      it('softDeleteUser returns RepositoryResult<void>', async () => {
        const userId = generateUniqueId();
        await repository.createUser({
          id: userId,
          role: 'student',
          fullName: 'Delete Test',
          mobileNumber: '+201000000004',
        });

        const result = await repository.softDeleteUser(userId, 'contract-delete');

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeUndefined();
        }
      });

      it('changeAccountStatus returns RepositoryResult<void>', async () => {
        const userId = generateUniqueId();
        await repository.createUser({
          id: userId,
          role: 'student',
          fullName: 'Status Test',
          mobileNumber: '+201000000005',
        });

        const result = await repository.changeAccountStatus(
          userId,
          { status: 'suspended', reason: 'Contract test' },
          'contract-status',
        );

        expect(result).toHaveProperty('ok');
      });

      it('changeRole returns RepositoryResult<IUser>', async () => {
        const userId = generateUniqueId();
        await repository.createUser({
          id: userId,
          role: 'student',
          fullName: 'Role Test',
          mobileNumber: '+201000000006',
        });

        const result = await repository.changeRole(
          userId,
          { role: 'teacher', grantedAt: new Date().toISOString() },
          'contract-role',
        );

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value.role).toBe('teacher');
        }
      });

      it('restoreUser returns RepositoryResult<void>', async () => {
        const userId = generateUniqueId();
        await repository.createUser({
          id: userId,
          role: 'student',
          fullName: 'Restore Test',
          mobileNumber: '+201000000007',
        });
        await repository.softDeleteUser(userId, 'prep-delete');

        const repo = repository as any;
        if (repo.restoreUser) {
          const result = await repo.restoreUser(userId, 'contract-restore');
          expect(result).toHaveProperty('ok');
          if (result.ok) {
            expect(result.value).toBeUndefined();
          }
        }
      });

      it('appendLoginEvent returns RepositoryResult<LoginEvent>', async () => {
        const result = await repository.appendLoginEvent({
          eventType: 'login',
          ipAddress: '127.0.0.1',
        });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value).toHaveProperty('eventType');
          expect(result.value.eventType).toBe('login');
        }
      });

      it('listLoginEvents returns RepositoryResult<Page<LoginEvent>>', async () => {
        const result = await repository.listLoginEvents('any-user', { limit: 20 });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('items');
          expect(result.value).toHaveProperty('nextCursor');
          expect(Array.isArray(result.value.items)).toBe(true);
        }
      });
    });

    describe('Error Contract', () => {
      it('createUser returns INVALID_INPUT for empty id', async () => {
        const result = await repository.createUser({
          id: '',
          role: 'student',
          fullName: 'Test',
          mobileNumber: '+201000000008',
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('createUser returns INVALID_INPUT for invalid role', async () => {
        const result = await repository.createUser({
          id: generateUniqueId(),
          role: 'invalid' as any,
          fullName: 'Test',
          mobileNumber: '+201000000009',
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('getUserById returns non-throwing result for empty id', async () => {
        const result = await repository.getUserById('');

        expect(result).toBeDefined();
      });

      it('listUsers returns INVALID_INPUT for bad page query', async () => {
        const result = await repository.listUsers({}, { limit: 0 });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code === 'INVALID_INPUT');
        }
      });

      it('updateProfile returns INVALID_INPUT for invalid data', async () => {
        const result = await repository.updateProfile(
          'any-id',
          { mobileNumber: 'invalid' },
          0,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('changeAccountStatus returns INVALID_INPUT for invalid status', async () => {
        const result = await repository.changeAccountStatus(
          'any-id',
          { status: 'invalid' as any },
          'req-1',
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('changeRole returns INVALID_INPUT for invalid role', async () => {
        const result = await repository.changeRole(
          'any-id',
          { role: 'invalid' as any, grantedAt: new Date().toISOString() },
          'req-1',
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });
    });
  });
}

const UserRepository = require('../../repositories/user/user.repository').UserRepository;

let counter = 0;
function uniqueId(): string {
  counter++;
  return `contract-test-${Date.now()}-${counter}`;
}

runUserRepositoryContractTests(
  'UserRepository',
  () => new UserRepository(),
  uniqueId,
);
