import { z } from 'zod';

const mobileRegex = /^\+?[1-9]\d{6,14}$/;
export const UserRoleEnum = z.enum([
  'student',
  'teacher',
  'staff',
  'secretary',
  'support',
  'administrator',
]);

export const AccountStatusEnum = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending',
]);

export const CreateUserInputSchema = z.object({
  id: z.string().min(1).max(128),
  role: UserRoleEnum,
  fullName: z.string().min(1).max(200),
  mobileNumber: z.string().regex(mobileRegex, 'Invalid mobile number format'),
  isActive: z.boolean().optional().default(true),
  email: z.string().email().optional(),
  englishName: z.string().max(200).optional(),
  parentMobile: z.string().regex(mobileRegex).optional(),
  governorate: z.string().max(100).optional(),
  school: z.string().max(200).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  jobTitle: z.string().max(200).optional(),
  educationalSystemId: z.string().max(128).optional(),
  stageId: z.string().max(128).optional(),
  gradeId: z.string().max(128).optional(),
  academicYearId: z.string().max(128).optional(),
  termId: z.string().max(128).optional(),
});

export const UpdateProfileInputSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  mobileNumber: z.string().regex(mobileRegex).optional(),
  email: z.string().email().optional(),
  englishName: z.string().max(200).optional(),
  parentMobile: z.string().regex(mobileRegex).optional(),
  governorate: z.string().max(100).optional(),
  school: z.string().max(200).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  jobTitle: z.string().max(200).optional(),
});

export const ChangeStatusInputSchema = z.object({
  status: AccountStatusEnum,
  reason: z.string().max(500).optional(),
  requestId: z.string().min(1).max(128),
});

export const ChangeRoleInputSchema = z.object({
  role: UserRoleEnum,
  requestId: z.string().min(1).max(128),
});

export const SoftDeleteInputSchema = z.object({
  requestId: z.string().min(1).max(128),
});

export const RestoreUserInputSchema = z.object({
  requestId: z.string().min(1).max(128),
});

export const AcademicAssignmentInputSchema = z.object({
  educationalSystemId: z.string().max(128).optional(),
  stageId: z.string().max(128).optional(),
  gradeId: z.string().max(128).optional(),
  academicYearId: z.string().max(128).optional(),
  termId: z.string().max(128).optional(),
});

export const UserFilterSchema = z.object({
  role: z.array(UserRoleEnum).optional(),
  isActive: z.boolean().optional(),
  gradeId: z.string().max(128).optional(),
  status: z.array(AccountStatusEnum).optional(),
  search: z.string().max(200).optional(),
});

export const PageQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const ListUsersQuerySchema = z.object({
  filter: UserFilterSchema.optional().default({}),
  page: PageQuerySchema.default({ limit: 20 }),
});

export const AppendLoginEventInputSchema = z.object({
  eventType: z.string().min(1).max(50),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
});

export const UserIdSchema = z.string().min(1).max(128);

export const UserIdsSchema = z.array(UserIdSchema).min(1).max(100);

export type CreateUserInputType = z.infer<typeof CreateUserInputSchema>;
export type UpdateProfileInputType = z.infer<typeof UpdateProfileInputSchema>;
export type ChangeStatusInputType = z.infer<typeof ChangeStatusInputSchema>;
export type ChangeRoleInputType = z.infer<typeof ChangeRoleInputSchema>;
export type SoftDeleteInputType = z.infer<typeof SoftDeleteInputSchema>;
export type RestoreUserInputType = z.infer<typeof RestoreUserInputSchema>;
export type AcademicAssignmentInputType = z.infer<typeof AcademicAssignmentInputSchema>;
export type UserFilterType = z.infer<typeof UserFilterSchema>;
export type PageQueryType = z.infer<typeof PageQuerySchema>;
export type ListUsersQueryType = z.infer<typeof ListUsersQuerySchema>;
export type AppendLoginEventInputType = z.infer<typeof AppendLoginEventInputSchema>;
