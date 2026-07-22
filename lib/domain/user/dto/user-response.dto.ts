export interface UserResponseDTO {
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
  readonly statusReason?: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly termId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UserListResponseDTO {
  readonly items: ReadonlyArray<UserSummaryResponseDTO>;
  readonly nextCursor: string | null;
}

export interface UserSummaryResponseDTO {
  readonly id: string;
  readonly role: string;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface ApiResponseDTO<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
  readonly timestamp: string;
}

export interface PaginatedApiResponseDTO<T> {
  readonly success: boolean;
  readonly data?: {
    readonly items: ReadonlyArray<T>;
    readonly nextCursor: string | null;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
  readonly timestamp: string;
}
