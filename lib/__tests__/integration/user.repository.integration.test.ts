import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { UserRepository } from '../../repositories/user/user.repository';

/**
 * Integration tests for UserRepository against Firebase Emulator.
 *
 * These tests require the Firebase Emulator Suite to be running locally.
 * Skip these tests if the emulator is not available.
 *
 * To run: firebase emulators:start --only firestore
 * Then: npx jest --testPathPattern=integration
 */

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const testIntegration = isEmulatorAvailable ? describe : describe.skip;
testIntegration('UserRepository Integration Tests', () => {
  let repository: UserRepository;
  const testUserId = `integration-test-${Date.now()}`;

  beforeAll(async () => {
    repository = new UserRepository();
  });

  afterAll(async () => {
    if (repository && isEmulatorAvailable) {
      await repository.softDeleteUser(testUserId, 'cleanup');
    }
  });

  it('creates a user in Firestore', async () => {
    const result = await repository.createUser({
      id: testUserId,
      role: 'student',
      fullName: 'Integration Test User',
      mobileNumber: '+201000000000',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(testUserId);
      expect(result.value.role).toBe('student');
      expect(result.value.isActive).toBe(true);
    }
  });

  it('retrieves the created user by id', async () => {
    const result = await repository.getUserById(testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(testUserId);
      expect(result.value.fullName).toBe('Integration Test User');
    }
  });

  it('finds user by mobile number', async () => {
    const result = await repository.findUserByMobile('+201000000000');

    expect(result.ok).toBe(true);
    if (result.ok && result.value) {
      expect(result.value.id).toBe(testUserId);
    }
  });

  it('updates user profile', async () => {
    const result = await repository.updateProfile(
      testUserId,
      { fullName: 'Updated Integration Name' },
      0,
    );

    expect(result.ok).toBe(true);
  });

  it('lists users with pagination', async () => {
    const result = await repository.listUsers(
      { role: ['student'] },
      { limit: 10 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.value.items)).toBe(true);
      expect(result.value.items.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('filters users by isActive', async () => {
    const result = await repository.listUsers(
      { isActive: true },
      { limit: 10 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      result.value.items.forEach((user) => {
        expect(user.isActive).toBe(true);
      });
    }
  });

  it('supports cursor pagination', async () => {
    const page1 = await repository.listUsers({}, { limit: 1 });

    expect(page1.ok).toBe(true);
    if (page1.ok) {
      const page2 = await repository.listUsers(
        {},
        { limit: 1, cursor: page1.value.nextCursor ?? undefined },
      );

      expect(page2.ok).toBe(true);
    }
  });

  it('changes user account status', async () => {
    const result = await repository.changeAccountStatus(
      testUserId,
      { status: 'suspended', reason: 'Integration test' },
      `req-${Date.now()}`,
    );

    expect(result.ok).toBe(true);
  });

  it('changes user role', async () => {
    const result = await repository.changeRole(
      testUserId,
      { role: 'teacher', grantedAt: new Date().toISOString() },
      `req-${Date.now()}`,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe('teacher');
    }
  });

  it('soft deletes user', async () => {
    const result = await repository.softDeleteUser(testUserId, `delete-${Date.now()}`);

    expect(result.ok).toBe(true);
  });

  it('returns not found after soft delete', async () => {
    const result = await repository.getUserById(testUserId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('restores soft-deleted user', async () => {
    const restoreResult = await repository.restoreUser(testUserId, `restore-${Date.now()}`);
    expect(restoreResult.ok).toBe(true);

    const user = await repository.getUserById(testUserId);
    expect(user.ok).toBe(true);
    if (user.ok && user.value) {
      expect(user.value.id).toBe(testUserId);
    }
  });

  it('handles duplicate user creation returns ALREADY_EXISTS', async () => {
    const result = await repository.createUser({
      id: testUserId,
      role: 'student',
      fullName: 'Duplicate',
      mobileNumber: '+209999999999',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ALREADY_EXISTS');
    }
  });

  it('appends login event', async () => {
    const result = await repository.appendLoginEvent({
      eventType: 'login',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventType).toBe('login');
    }
  });

  it('handles not found for non-existent user', async () => {
    const result = await repository.getUserById('non-existent-id-12345');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns empty list for no matching filters', async () => {
    const result = await repository.listUsers(
      { role: ['administrator'], isActive: false },
      { limit: 10 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toEqual([]);
      expect(result.value.nextCursor).toBeNull();
    }
  });
});
