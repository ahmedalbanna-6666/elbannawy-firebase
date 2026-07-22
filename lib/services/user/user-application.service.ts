import { UserService, CreateUserDomainInput, UpdateProfileDomainInput } from './user.service';
import { IUser } from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import {
  CreateUserInputSchema,
  UpdateProfileInputSchema,
  ChangeStatusInputSchema,
  ChangeRoleInputSchema,
  UserFilterSchema,
  PageQuerySchema,
  UserIdSchema,
} from '../../repositories/validators/user.validator';

export interface UserOutput {
  readonly id: string;
  readonly role: string;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly email?: string;
  readonly englishName?: string;
  readonly parentMobile?: string;
  readonly governorate?: string;
  readonly school?: string;
  readonly avatarUrl?: string;
  readonly jobTitle?: string;
  readonly isActive: boolean;
  readonly status: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly termId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UserListOutput {
  readonly items: ReadonlyArray<{
    readonly id: string;
    readonly role: string;
    readonly fullName: string;
    readonly mobileNumber: string;
    readonly isActive: boolean;
    readonly createdAt: string;
  }>;
  readonly nextCursor: string | null;
}

function mapUserToOutput(user: IUser): UserOutput {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    mobileNumber: user.mobileNumber,
    isActive: user.isActive,
    status: 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserApplicationService {
  constructor(private readonly userService: UserService) {}

  async createUser(input: Record<string, unknown>): Promise<RepositoryResult<UserOutput>> {
    const parsed = CreateUserInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const domainInput: CreateUserDomainInput = {
      id: parsed.data.id,
      role: parsed.data.role,
      fullName: parsed.data.fullName,
      mobileNumber: parsed.data.mobileNumber,
      isActive: parsed.data.isActive,
      email: parsed.data.email,
      englishName: parsed.data.englishName,
      parentMobile: parsed.data.parentMobile,
      governorate: parsed.data.governorate,
      school: parsed.data.school,
      avatarUrl: parsed.data.avatarUrl,
      jobTitle: parsed.data.jobTitle,
      educationalSystemId: parsed.data.educationalSystemId,
      stageId: parsed.data.stageId,
      gradeId: parsed.data.gradeId,
      academicYearId: parsed.data.academicYearId,
      termId: parsed.data.termId,
    };

    const result = await this.userService.createUser(domainInput);
    if (!result.ok) {
      return result as RepositoryResult<UserOutput>;
    }

    return { ok: true, value: mapUserToOutput(result.value) };
  }

  async getUserById(userId: string): Promise<RepositoryResult<UserOutput>> {
    const parsedId = UserIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedId.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const result = await this.userService.getUserById(parsedId.data);
    if (!result.ok) {
      return result as RepositoryResult<UserOutput>;
    }

    return { ok: true, value: mapUserToOutput(result.value) };
  }

  async updateProfile(
    userId: string,
    input: Record<string, unknown>,
    expectedVersion: number,
  ): Promise<RepositoryResult<UserOutput>> {
    const parsedId = UserIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedId.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const parsed = UpdateProfileInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const domainInput: UpdateProfileDomainInput = {
      fullName: parsed.data.fullName,
      mobileNumber: parsed.data.mobileNumber,
      email: parsed.data.email,
      englishName: parsed.data.englishName,
      parentMobile: parsed.data.parentMobile,
      governorate: parsed.data.governorate,
      school: parsed.data.school,
      avatarUrl: parsed.data.avatarUrl,
      jobTitle: parsed.data.jobTitle,
    };

    const result = await this.userService.updateProfile(parsedId.data, domainInput, expectedVersion);
    if (!result.ok) {
      return result as RepositoryResult<UserOutput>;
    }

    return { ok: true, value: mapUserToOutput(result.value) };
  }

  async changeStatus(
    userId: string,
    input: Record<string, unknown>,
  ): Promise<RepositoryResult<void>> {
    const parsedId = UserIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedId.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const parsed = ChangeStatusInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    return this.userService.changeAccountStatus(parsedId.data, parsed.data);
  }

  async changeRole(
    userId: string,
    input: Record<string, unknown>,
  ): Promise<RepositoryResult<UserOutput>> {
    const parsedId = UserIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedId.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const parsed = ChangeRoleInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const result = await this.userService.changeRole(parsedId.data, parsed.data);
    if (!result.ok) {
      return result as RepositoryResult<UserOutput>;
    }

    return { ok: true, value: mapUserToOutput(result.value) };
  }

  async softDeleteUser(userId: string, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = UserIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedId.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    return this.userService.softDeleteUser(parsedId.data, requestId);
  }

  async restoreUser(userId: string, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = UserIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedId.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    return this.userService.restoreUser(parsedId.data, requestId);
  }

  async listUsers(
    filter: Record<string, unknown>,
    page: Record<string, unknown>,
  ): Promise<RepositoryResult<UserListOutput>> {
    const parsedFilter = UserFilterSchema.safeParse(filter);
    if (!parsedFilter.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedFilter.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const parsedPage = PageQuerySchema.safeParse(page);
    if (!parsedPage.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsedPage.error.message,
          retryable: false,
          requestId: '',
        },
      };
    }

    const result = await this.userService.listUsers(parsedFilter.data, parsedPage.data);
    if (!result.ok) {
      return result as unknown as RepositoryResult<UserListOutput>;
    }

    return {
      ok: true,
      value: {
        items: result.value.items.map((item) => ({
          id: item.id,
          role: item.role,
          fullName: item.fullName,
          mobileNumber: item.mobileNumber,
          isActive: item.isActive,
          createdAt: item.createdAt,
        })),
        nextCursor: result.value.nextCursor,
      },
    };
  }
}
