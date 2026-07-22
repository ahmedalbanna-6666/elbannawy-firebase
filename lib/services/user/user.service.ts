import { IUserRepository, IUser, UserSummary } from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { UserRepository } from '../../repositories/user/user.repository';

export interface CreateUserDomainInput {
  readonly id: string;
  readonly role: 'student' | 'teacher' | 'staff' | 'secretary' | 'support' | 'administrator';
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive?: boolean;
  readonly email?: string;
  readonly englishName?: string;
  readonly parentMobile?: string;
  readonly governorate?: string;
  readonly school?: string;
  readonly avatarUrl?: string;
  readonly jobTitle?: string;
  readonly educationalSystemId?: string;
  readonly stageId?: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly termId?: string;
}

export interface UpdateProfileDomainInput {
  readonly fullName?: string;
  readonly mobileNumber?: string;
  readonly email?: string;
  readonly englishName?: string;
  readonly parentMobile?: string;
  readonly governorate?: string;
  readonly school?: string;
  readonly avatarUrl?: string;
  readonly jobTitle?: string;
}

export interface ChangeStatusDomainInput {
  readonly status: 'active' | 'inactive' | 'suspended' | 'pending';
  readonly reason?: string;
  readonly requestId: string;
}

export interface ChangeRoleDomainInput {
  readonly role: 'student' | 'teacher' | 'staff' | 'secretary' | 'support' | 'administrator';
  readonly requestId: string;
}

export interface UserFilterDomain {
  readonly role?: Array<'student' | 'teacher' | 'staff' | 'secretary' | 'support' | 'administrator'>;
  readonly isActive?: boolean;
  readonly gradeId?: string;
  readonly status?: Array<'active' | 'inactive' | 'suspended' | 'pending'>;
  readonly search?: string;
}

export class UserService {
  constructor(private readonly userRepository: IUserRepository = new UserRepository()) {}

  async createUser(input: CreateUserDomainInput): Promise<RepositoryResult<IUser>> {
    return this.userRepository.createUser(input);
  }

  async getUserById(userId: string): Promise<RepositoryResult<IUser>> {
    return this.userRepository.getUserById(userId);
  }

  async findUserByMobile(mobileNumber: string): Promise<RepositoryResult<IUser | null>> {
    return this.userRepository.findUserByMobile(mobileNumber);
  }

  async findUserByEmail(email: string): Promise<RepositoryResult<IUser | null>> {
    return this.userRepository.findUserByEmail(email);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileDomainInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IUser>> {
    return this.userRepository.updateProfile(userId, input, expectedVersion);
  }

  async listUsers(
    filter: UserFilterDomain,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<UserSummary>>> {
    return this.userRepository.listUsers(filter, page);
  }

  async changeAccountStatus(
    userId: string,
    input: ChangeStatusDomainInput,
  ): Promise<RepositoryResult<void>> {
    return this.userRepository.changeAccountStatus(
      userId,
      { status: input.status, reason: input.reason },
      input.requestId,
    );
  }

  async changeRole(
    userId: string,
    input: ChangeRoleDomainInput,
  ): Promise<RepositoryResult<IUser>> {
    return this.userRepository.changeRole(
      userId,
      { role: input.role, grantedAt: new Date().toISOString() },
      input.requestId,
    );
  }

  async softDeleteUser(userId: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.userRepository.softDeleteUser(userId, requestId);
  }

  async restoreUser(userId: string, requestId: string): Promise<RepositoryResult<void>> {
    const repo = this.userRepository as IUserRepository & { restoreUser?(id: string, reqId: string): Promise<RepositoryResult<void>> };
    if (repo.restoreUser) {
      return repo.restoreUser(userId, requestId);
    }
    return {
      ok: false,
      error: {
        code: 'INTERNAL',
        message: 'Restore operation is not supported',
        retryable: false,
        requestId,
      },
    };
  }

  getRepository(): IUserRepository {
    return this.userRepository;
  }
}
