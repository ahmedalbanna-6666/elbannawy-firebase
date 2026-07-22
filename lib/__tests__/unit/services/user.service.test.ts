import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserService } from '../../../services/user/user.service';
import { RepositoryResult } from '../../../shared/types/repository.types';

const mockRepository = {
  createUser: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  getUserById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  findUserByMobile: jest.fn<(mobile: string) => Promise<RepositoryResult<any | null>>>(),
  findUserByEmail: jest.fn<(email: string) => Promise<RepositoryResult<any | null>>>(),
  updateProfile: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  updateAcademicAssignment: jest.fn<(id: string, input: any) => Promise<RepositoryResult<any>>>(),
  changeAccountStatus: jest.fn<(id: string, status: any, requestId: string) => Promise<RepositoryResult<void>>>(),
  changeRole: jest.fn<(id: string, role: any, requestId: string) => Promise<RepositoryResult<any>>>(),
  softDeleteUser: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<void>>>(),
  restoreUser: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<void>>>(),
  listUsers: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  appendLoginEvent: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  listLoginEvents: jest.fn<(userId: string, page: any) => Promise<RepositoryResult<any>>>(),
  exists: jest.fn<(id: string) => Promise<boolean>>(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(mockRepository as any);
  });

  describe('createUser', () => {
    it('creates user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.createUser.mockResolvedValue({ ok: true, value: mockUser });

      const result = await service.createUser({
        id: 'user-1',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockUser);
      }
      expect(mockRepository.createUser).toHaveBeenCalledWith({
        id: 'user-1',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
      });
    });

    it('forwards repository error', async () => {
      mockRepository.createUser.mockResolvedValue({
        ok: false,
        error: { code: 'ALREADY_EXISTS', message: 'User exists', retryable: false, requestId: '' },
      });

      const result = await service.createUser({
        id: 'user-1',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS');
      }
    });
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.getUserById.mockResolvedValue({ ok: true, value: mockUser });

      const result = await service.getUserById('user-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('user-1');
      }
    });

    it('forwards not found error', async () => {
      mockRepository.getUserById.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'User not found', retryable: false, requestId: '' },
      });

      const result = await service.getUserById('invalid');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listUsers', () => {
    it('returns paginated users', async () => {
      const mockPage = {
        items: [
          {
            id: 'user-1',
            role: 'student',
            fullName: 'Test User',
            mobileNumber: '+201234567890',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: 'cursor-abc',
      };

      mockRepository.listUsers.mockResolvedValue({ ok: true, value: mockPage });

      const result = await service.listUsers({ role: ['student'] }, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.nextCursor).toBe('cursor-abc');
      }
    });

    it('forwards repository error', async () => {
      mockRepository.listUsers.mockResolvedValue({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid filter', retryable: false, requestId: '' },
      });

      const result = await service.listUsers({ role: ['invalid' as any] }, { limit: 20 });

      expect(result.ok).toBe(false);
    });
  });

  describe('changeAccountStatus', () => {
    it('changes status successfully', async () => {
      mockRepository.changeAccountStatus.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.changeAccountStatus('user-1', {
        status: 'suspended',
        reason: 'test',
        requestId: 'req-1',
      });

      expect(result.ok).toBe(true);
      expect(mockRepository.changeAccountStatus).toHaveBeenCalledWith(
        'user-1',
        { status: 'suspended', reason: 'test' },
        'req-1',
      );
    });
  });

  describe('changeRole', () => {
    it('changes role successfully', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'teacher' as const,
        fullName: 'Test User',
        mobileNumber: '+201234567890',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.changeRole.mockResolvedValue({ ok: true, value: mockUser });

      const result = await service.changeRole('user-1', {
        role: 'teacher',
        requestId: 'req-1',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.role).toBe('teacher');
      }
    });
  });

  describe('softDeleteUser', () => {
    it('deletes user successfully', async () => {
      mockRepository.softDeleteUser.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.softDeleteUser('user-1', 'req-1');

      expect(result.ok).toBe(true);
    });
  });

  describe('restoreUser', () => {
    it('restores user if repository supports it', async () => {
      mockRepository.restoreUser.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.restoreUser('user-1', 'req-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.restoreUser).toHaveBeenCalledWith('user-1', 'req-1');
    });
  });

  describe('findUserByMobile', () => {
    it('returns user when found', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'student',
        fullName: 'Test User',
        mobileNumber: '+201234567890',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.findUserByMobile.mockResolvedValue({ ok: true, value: mockUser });

      const result = await service.findUserByMobile('+201234567890');

      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.id).toBe('user-1');
      }
    });

    it('returns null when not found', async () => {
      mockRepository.findUserByMobile.mockResolvedValue({ ok: true, value: null });

      const result = await service.findUserByMobile('+201111111111');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });
});
