import { IBaseEntity } from '../../../repositories/contracts';

export type UserRoleType = 'student' | 'teacher' | 'staff' | 'secretary' | 'support' | 'administrator';

export interface UserRole {
  readonly role: UserRoleType;
  readonly grantedAt: string;
}

export interface AccountStatus {
  readonly status: 'active' | 'inactive' | 'suspended' | 'pending';
  readonly reason?: string;
}

export interface IUser extends IBaseEntity {
  readonly id: string;
  readonly role: UserRole;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive: boolean;
  readonly educationalSystemId?: string;
  readonly stageId?: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly termId?: string;
  readonly email?: string;
  readonly englishName?: string;
  readonly parentMobile?: string;
  readonly governorate?: string;
  readonly school?: string;
  readonly avatarUrl?: string;
  readonly jobTitle?: string;
  readonly createdBy?: string;
  readonly status: AccountStatus;
  readonly roleProfile?: RoleProfile;
}

export interface RoleProfile {
  readonly stage?: { readonly id: string; readonly name: string } | null;
  readonly grade?: { readonly id: string; readonly name: string } | null;
  readonly currentTerm?: { readonly id: string; readonly name: string } | null;
  readonly assignedGrades?: Array<{ readonly id: string; readonly name: string }>;
  readonly totalStudents?: number;
  readonly jobTitle?: string | null;
  readonly permissions?: Array<{ readonly key: string; readonly label: string }>;
  readonly administrationType?: string;
  readonly accessScope?: 'FULL' | 'CUSTOM';
}

export interface UserSummary {
  readonly id: string;
  readonly role: UserRole;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}


