import { UserRoleType } from './user.entity';

export interface CreateUserInput {
  readonly id: string;
  readonly role: UserRoleType;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive?: boolean;
}
