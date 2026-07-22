import { BaseRepository } from '../base/base-repository';
import { TransactionManager } from '../transactions/transaction-manager';
import { QueryBuilder } from '../query-builder';
import {
  IUserRepository,
  IUser,
  CreateUserInput,
  UpdateProfileInput,
  AcademicAssignmentInput,
  AccountStatus,
  Role,
  UserFilter,
  LoginEvent,
  AppendLoginEventInput,
  UserSummary,
} from '../contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { UserFirestoreMapper, UserFirestoreDocument } from './user-firestore-mapper';
import {
  CreateUserInputSchema,
  UpdateProfileInputSchema,
  ChangeStatusInputSchema,
  ChangeRoleInputSchema,
  SoftDeleteInputSchema,
  RestoreUserInputSchema,
  AcademicAssignmentInputSchema,
  AppendLoginEventInputSchema,
  UserFilterSchema,
  PageQuerySchema,
} from '../validators/user.validator';

const COLLECTION_USERS = 'users';
const COLLECTION_LOGIN_EVENTS = 'loginEvents';

export class UserRepository
  extends BaseRepository<UserFirestoreDocument>
  implements IUserRepository
{
  protected readonly collection = COLLECTION_USERS;
  protected readonly transactionManager = TransactionManager.getInstance();

  async createUser(input: CreateUserInput): Promise<RepositoryResult<IUser>> {
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

    const now = new Date().toISOString();
    const userData: UserFirestoreDocument = {
      id: parsed.data.id,
      fullName: parsed.data.fullName,
      mobileNumber: parsed.data.mobileNumber,
      isActive: parsed.data.isActive ?? true,
      role: {
        role: parsed.data.role,
        grantedAt: now,
      },
      status: {
        status: 'active',
        reason: null,
      },
      email: parsed.data.email ?? null,
      englishName: parsed.data.englishName ?? null,
      parentMobile: parsed.data.parentMobile ?? null,
      governorate: parsed.data.governorate ?? null,
      school: parsed.data.school ?? null,
      avatarUrl: parsed.data.avatarUrl ?? null,
      jobTitle: parsed.data.jobTitle ?? null,
      educationalSystemId: parsed.data.educationalSystemId ?? null,
      stageId: parsed.data.stageId ?? null,
      gradeId: parsed.data.gradeId ?? null,
      academicYearId: parsed.data.academicYearId ?? null,
      termId: parsed.data.termId ?? null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: UserFirestoreMapper.SCHEMA_VERSION,
      deletedAt: null,
    };

    return this.createUserDocument(userData);
  }

  private async createUserDocument(
    data: UserFirestoreDocument,
  ): Promise<RepositoryResult<IUser>> {
    const result = await this.create(data as unknown as Partial<UserFirestoreDocument>);
    if (!result.ok) {
      return result as RepositoryResult<IUser>;
    }
    const value = result.value as unknown as UserFirestoreDocument;
    return { ok: true, value: UserFirestoreMapper.toContract(value) };
  }

  async getUserById(userId: string): Promise<RepositoryResult<IUser>> {
    const parsed = this.parseId(userId);
    if (!parsed.ok) return parsed;

    const result = await this.getById(userId);
    if (!result.ok) {
      return result as RepositoryResult<IUser>;
    }
    if (!result.value) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: `User not found: ${userId}`,
          retryable: false,
          requestId: '',
        },
      };
    }
    const doc = result.value as unknown as UserFirestoreDocument;
    if (doc.deletedAt) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: `User not found: ${userId}`,
          retryable: false,
          requestId: '',
        },
      };
    }
    return { ok: true, value: UserFirestoreMapper.toContract(doc) };
  }

  async findUserByMobile(mobileNumber: string): Promise<RepositoryResult<IUser | null>> {
    if (!mobileNumber || mobileNumber.trim().length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Mobile number is required',
          retryable: false,
          requestId: '',
        },
      };
    }

    try {
      const query = new QueryBuilder<UserFirestoreDocument>(this.transactionManager);
      query.withFilter('mobileNumber', 'eq', mobileNumber);
      query.withFilter('deletedAt', 'eq', null);
      query.withLimit(1);

      const result = await query.execute(COLLECTION_USERS);
      if (!result.ok) {
        return result as unknown as RepositoryResult<IUser | null>;
      }

      const items = result.value.items;
      if (items.length === 0) {
        return { ok: true, value: null };
      }

      return { ok: true, value: UserFirestoreMapper.toContract(items[0] as unknown as UserFirestoreDocument) };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: (error as Error).message,
          retryable: false,
          requestId: '',
        },
      };
    }
  }

  async findUserByEmail(email: string): Promise<RepositoryResult<IUser | null>> {
    if (!email || email.trim().length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email is required',
          retryable: false,
          requestId: '',
        },
      };
    }

    try {
      const query = new QueryBuilder<UserFirestoreDocument>(this.transactionManager);
      query.withFilter('email', 'eq', email);
      query.withFilter('deletedAt', 'eq', null);
      query.withLimit(1);

      const result = await query.execute(COLLECTION_USERS);
      if (!result.ok) {
        return result as unknown as RepositoryResult<IUser | null>;
      }

      const items = result.value.items;
      if (items.length === 0) {
        return { ok: true, value: null };
      }

      return { ok: true, value: UserFirestoreMapper.toContract(items[0] as unknown as UserFirestoreDocument) };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: (error as Error).message,
          retryable: false,
          requestId: '',
        },
      };
    }
  }

  async listUsers(
    filter: UserFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<UserSummary>>> {
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

    try {
      const query = new QueryBuilder<UserFirestoreDocument>(this.transactionManager);

      query.withFilter('deletedAt', 'eq', null);

      if (parsedFilter.data.role && parsedFilter.data.role.length > 0) {
        if (parsedFilter.data.role.length === 1) {
          query.withFilter('role.role', 'eq', parsedFilter.data.role[0]);
        } else {
          query.withFilter('role.role', 'in', parsedFilter.data.role);
        }
      }

      if (parsedFilter.data.isActive !== undefined) {
        query.withFilter('isActive', 'eq', parsedFilter.data.isActive);
      }

      if (parsedFilter.data.gradeId) {
        query.withFilter('gradeId', 'eq', parsedFilter.data.gradeId);
      }

      if (parsedFilter.data.status && parsedFilter.data.status.length > 0) {
        if (parsedFilter.data.status.length === 1) {
          query.withFilter('status.status', 'eq', parsedFilter.data.status[0]);
        } else {
          query.withFilter('status.status', 'in', parsedFilter.data.status);
        }
      }

      query.withOrderBy('createdAt', 'desc');
      query.withLimit(parsedPage.data.limit);

      if (parsedPage.data.cursor) {
        try {
          const cursorObj = JSON.parse(parsedPage.data.cursor);
          query.withCursor(cursorObj);
        } catch {
          return {
            ok: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid cursor format',
              retryable: false,
              requestId: '',
            },
          };
        }
      }

      const result = await query.execute(COLLECTION_USERS);
      if (!result.ok) {
        return result as unknown as RepositoryResult<Page<UserSummary>>;
      }

      const items: UserSummary[] = result.value.items.map((doc) => {
        const d = doc as unknown as UserFirestoreDocument;
        return {
          id: d.id,
          role: d.role.role,
          fullName: d.fullName,
          mobileNumber: d.mobileNumber,
          isActive: d.isActive,
          createdAt: UserFirestoreMapper.formatTimestamp(d.createdAt),
        };
      });

      const nextCursor = result.value.nextCursor;

      return {
        ok: true,
        value: { items, nextCursor },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: (error as Error).message,
          retryable: false,
          requestId: '',
        },
      };
    }
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IUser>> {
    const parsedId = this.parseId(userId);
    if (!parsedId.ok) return parsedId;

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

    const firestoreData = UserFirestoreMapper.toFirestore(parsed.data as any);
    const result = await this.update(userId, firestoreData, expectedVersion);
    if (!result.ok) {
      return result as RepositoryResult<IUser>;
    }
    const value = result.value as unknown as UserFirestoreDocument;
    return { ok: true, value: UserFirestoreMapper.toContract(value) };
  }

  async updateAcademicAssignment(
    userId: string,
    input: AcademicAssignmentInput,
  ): Promise<RepositoryResult<IUser>> {
    const parsedId = this.parseId(userId);
    if (!parsedId.ok) return parsedId;

    const parsed = AcademicAssignmentInputSchema.safeParse(input);
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

    const firestoreData = UserFirestoreMapper.toFirestore(parsed.data as any);
    const result = await this.update(userId, firestoreData, 0);
    if (!result.ok) {
      return result as RepositoryResult<IUser>;
    }
    const value = result.value as unknown as UserFirestoreDocument;
    return { ok: true, value: UserFirestoreMapper.toContract(value) };
  }

  async changeAccountStatus(
    userId: string,
    status: AccountStatus,
    requestId: string,
  ): Promise<RepositoryResult<void>> {
    const parsed = ChangeStatusInputSchema.safeParse({ ...status, requestId });
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

    const statusData = {
      status: {
        status: parsed.data.status,
        reason: parsed.data.reason ?? null,
      },
      updatedAt: new Date().toISOString(),
    };

    const updateResult = await this.update(userId, statusData, 0);
    if (!updateResult.ok) {
      return updateResult as RepositoryResult<void>;
    }

    return { ok: true, value: undefined };
  }

  async changeRole(
    userId: string,
    role: Role,
    requestId: string,
  ): Promise<RepositoryResult<IUser>> {
    const parsed = ChangeRoleInputSchema.safeParse({ ...role, requestId });
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

    const roleData = {
      role: {
        role: parsed.data.role,
        grantedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    const result = await this.update(userId, roleData, 0);
    if (!result.ok) {
      return result as RepositoryResult<IUser>;
    }
    const value = result.value as unknown as UserFirestoreDocument;
    return { ok: true, value: UserFirestoreMapper.toContract(value) };
  }

  async softDeleteUser(
    userId: string,
    requestId: string,
  ): Promise<RepositoryResult<void>> {
    const parsed = SoftDeleteInputSchema.safeParse({ requestId });
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

    return this.archive(userId);
  }

  async restoreUser(
    userId: string,
    requestId: string,
  ): Promise<RepositoryResult<void>> {
    const parsed = RestoreUserInputSchema.safeParse({ requestId });
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

    return this.restore(userId);
  }

  async appendLoginEvent(
    input: AppendLoginEventInput,
  ): Promise<RepositoryResult<LoginEvent>> {
    const parsed = AppendLoginEventInputSchema.safeParse(input);
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

    try {
      const now = new Date().toISOString();
      const event: LoginEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        userId: '',
        eventType: parsed.data.eventType,
        ipAddress: parsed.data.ipAddress,
        userAgent: parsed.data.userAgent,
        createdAt: now,
      };

      return { ok: true, value: event };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: (error as Error).message,
          retryable: false,
          requestId: '',
        },
      };
    }
  }

  async listLoginEvents(
    userId: string,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<LoginEvent>>> {
    const parsedId = this.parseId(userId);
    if (!parsedId.ok) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid user ID: ${userId}`,
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

    try {
      const query = new QueryBuilder<LoginEvent>(this.transactionManager);
      query.withFilter('userId', 'eq', userId);
      query.withOrderBy('createdAt', 'desc');
      query.withLimit(parsedPage.data.limit);

      if (parsedPage.data.cursor) {
        try {
          const cursorObj = JSON.parse(parsedPage.data.cursor);
          query.withCursor(cursorObj);
        } catch {
          return {
            ok: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Invalid cursor format',
              retryable: false,
              requestId: '',
            },
          };
        }
      }

      const result = await query.execute(COLLECTION_LOGIN_EVENTS);
      if (!result.ok) {
        return result as unknown as RepositoryResult<Page<LoginEvent>>;
      }

      return {
        ok: true,
        value: { items: result.value.items, nextCursor: result.value.nextCursor },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: (error as Error).message,
          retryable: false,
          requestId: '',
        },
      };
    }
  }

  protected async validateAndCreate(
    data: Partial<UserFirestoreDocument>,
  ): Promise<RepositoryResult<UserFirestoreDocument>> {
    if (!data.id) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID is required',
          retryable: false,
          requestId: '',
        },
      };
    }
    return { ok: true, value: data as UserFirestoreDocument };
  }

  protected async validateAndGetById(
    _id: string,
    doc: UserFirestoreDocument | null,
  ): Promise<RepositoryResult<UserFirestoreDocument | null>> {
    if (!_id) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID is required',
          retryable: false,
          requestId: '',
        },
      };
    }
    return { ok: true, value: doc };
  }

  protected async validateAndUpdate(
    _id: string,
    data: Partial<UserFirestoreDocument>,
    _expectedVersion: number,
  ): Promise<RepositoryResult<UserFirestoreDocument>> {
    if (!_id) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID is required for update',
          retryable: false,
          requestId: '',
        },
      };
    }
    const now = new Date().toISOString();
    const fullDoc: UserFirestoreDocument = {
      id: _id,
      fullName: data.fullName ?? '',
      email: data.email ?? null,
      englishName: data.englishName ?? null,
      mobileNumber: data.mobileNumber ?? '',
      parentMobile: data.parentMobile ?? null,
      role: data.role ?? { role: 'student', grantedAt: now },
      status: data.status ?? { status: 'active', reason: null },
      educationalSystemId: data.educationalSystemId ?? null,
      stageId: data.stageId ?? null,
      gradeId: data.gradeId ?? null,
      academicYearId: data.academicYearId ?? null,
      termId: data.termId ?? null,
      governorate: data.governorate ?? null,
      school: data.school ?? null,
      avatarUrl: data.avatarUrl ?? null,
      jobTitle: data.jobTitle ?? null,
      createdBy: data.createdBy ?? null,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt ?? now,
      updatedAt: now,
      schemaVersion: data.schemaVersion ?? 1,
      deletedAt: data.deletedAt ?? null,
    };
    return { ok: true, value: fullDoc };
  }

  protected async validateAndArchive(
    id: string,
  ): Promise<RepositoryResult<void>> {
    if (!id) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID is required for archive',
          retryable: false,
          requestId: '',
        },
      };
    }
    return { ok: true, value: undefined };
  }

  protected async validateAndRestore(
    id: string,
  ): Promise<RepositoryResult<void>> {
    if (!id) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID is required for restore',
          retryable: false,
          requestId: '',
        },
      };
    }
    return { ok: true, value: undefined };
  }

  protected async validateAndExists(id: string): Promise<boolean> {
    return id.length > 0;
  }

  private parseId(id: string): RepositoryResult<string> {
    if (!id || id.trim().length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID is required',
          retryable: false,
          requestId: '',
        },
      };
    }
    return { ok: true, value: id };
  }
}
