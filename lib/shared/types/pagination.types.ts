// lib/shared/types/pagination.types.ts

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

export interface PageQuery {
  readonly limit: number;
  readonly cursor?: string;
}

export interface IPaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface IPaginatedResponse<T> {
  readonly data: T[];
  readonly meta: IPaginationMeta;
}
