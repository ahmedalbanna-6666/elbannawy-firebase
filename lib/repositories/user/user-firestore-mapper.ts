import { IUser } from '../contracts';
import {
  IUser as DomainUser,
  UserRoleType,
  UserRole,
  AccountStatus,
} from '../../domain/user/entities/user.entity';
import { LoginEvent } from '../../domain/user/entities/login-event';

interface FirestoreTimestampLike {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

type TimestampOrString = FirestoreTimestampLike | string | Date;

export interface UserFirestoreDocument {
  id: string;
  fullName: string;
  englishName?: string | null;
  email?: string | null;
  mobileNumber: string;
  parentMobile?: string | null;
  role: {
    role: UserRoleType;
    grantedAt: string;
  };
  status: {
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    reason?: string | null;
  };
  educationalSystemId?: string | null;
  stageId?: string | null;
  gradeId?: string | null;
  academicYearId?: string | null;
  termId?: string | null;
  governorate?: string | null;
  school?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  createdBy?: string | null;
  createdAt: TimestampOrString;
  updatedAt: TimestampOrString;
  schemaVersion: number;
  deletedAt?: TimestampOrString | null;
  isActive: boolean;
}

export interface LoginEventFirestoreDocument {
  id: string;
  userId: string;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: TimestampOrString;
  schemaVersion: number;
}

export class UserFirestoreMapper {
  static readonly SCHEMA_VERSION = 1;

  static toDomain(doc: UserFirestoreDocument): DomainUser {
    const role: UserRole = {
      role: doc.role.role,
      grantedAt: doc.role.grantedAt,
    };

    const status: AccountStatus = {
      status: doc.status.status,
      reason: doc.status.reason ?? undefined,
    };

    return {
      id: doc.id,
      role,
      fullName: doc.fullName,
      mobileNumber: doc.mobileNumber,
      isActive: doc.isActive,
      email: doc.email ?? undefined,
      englishName: doc.englishName ?? undefined,
      parentMobile: doc.parentMobile ?? undefined,
      governorate: doc.governorate ?? undefined,
      school: doc.school ?? undefined,
      avatarUrl: doc.avatarUrl ?? undefined,
      jobTitle: doc.jobTitle ?? undefined,
      educationalSystemId: doc.educationalSystemId ?? undefined,
      stageId: doc.stageId ?? undefined,
      gradeId: doc.gradeId ?? undefined,
      academicYearId: doc.academicYearId ?? undefined,
      termId: doc.termId ?? undefined,
      createdBy: doc.createdBy ?? undefined,
      status,
      createdAt: this.formatTimestamp(doc.createdAt),
      updatedAt: this.formatTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? this.formatTimestamp(doc.deletedAt) : null,
    };
  }

  static toContract(doc: UserFirestoreDocument): IUser {
    return {
      id: doc.id,
      role: doc.role.role,
      fullName: doc.fullName,
      mobileNumber: doc.mobileNumber,
      isActive: doc.isActive,
      createdAt: this.formatTimestamp(doc.createdAt),
      updatedAt: this.formatTimestamp(doc.updatedAt),
    };
  }

  static toFirestore(entity: Partial<DomainUser>): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (entity.fullName !== undefined) data.fullName = entity.fullName;
    if (entity.englishName !== undefined) data.englishName = entity.englishName ?? null;
    if (entity.email !== undefined) data.email = entity.email ?? null;
    if (entity.mobileNumber !== undefined) data.mobileNumber = entity.mobileNumber;
    if (entity.parentMobile !== undefined) data.parentMobile = entity.parentMobile ?? null;
    if (entity.role !== undefined) data.role = entity.role;
    if (entity.status !== undefined) data.status = entity.status;
    if (entity.educationalSystemId !== undefined) data.educationalSystemId = entity.educationalSystemId ?? null;
    if (entity.stageId !== undefined) data.stageId = entity.stageId ?? null;
    if (entity.gradeId !== undefined) data.gradeId = entity.gradeId ?? null;
    if (entity.academicYearId !== undefined) data.academicYearId = entity.academicYearId ?? null;
    if (entity.termId !== undefined) data.termId = entity.termId ?? null;
    if (entity.governorate !== undefined) data.governorate = entity.governorate ?? null;
    if (entity.school !== undefined) data.school = entity.school ?? null;
    if (entity.avatarUrl !== undefined) data.avatarUrl = entity.avatarUrl ?? null;
    if (entity.jobTitle !== undefined) data.jobTitle = entity.jobTitle ?? null;
    if (entity.isActive !== undefined) data.isActive = entity.isActive;
    if (entity.createdBy !== undefined) data.createdBy = entity.createdBy ?? null;

    return data;
  }

  static toLoginEventDomain(doc: LoginEventFirestoreDocument): LoginEvent {
    return {
      id: doc.id,
      userId: doc.userId,
      eventType: doc.eventType,
      ipAddress: doc.ipAddress ?? undefined,
      userAgent: doc.userAgent ?? undefined,
      createdAt: this.formatTimestamp(doc.createdAt),
      schemaVersion: doc.schemaVersion,
    };
  }

  static formatTimestamp(value: TimestampOrString | unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as FirestoreTimestampLike).toDate().toISOString();
    }
    return String(value);
  }
}
