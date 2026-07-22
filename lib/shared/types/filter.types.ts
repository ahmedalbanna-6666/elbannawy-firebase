// lib/shared/types/filter.types.ts

export interface IFilter {
  readonly [key: string]: IFilterCondition;
}

export interface IFilterCondition {
  readonly $eq?: unknown;
  readonly $ne?: unknown;
  readonly $gt?: unknown;
  readonly $gte?: unknown;
  readonly $lt?: unknown;
  readonly $lte?: unknown;
  readonly $in?: unknown[];
  readonly $nin?: unknown[];
  readonly $regex?: string;
  readonly $exists?: boolean;
  readonly $elemMatch?: IFilter;
}

export interface IQueryFilterBuilder {
  buildFilter(filter: IFilter): string;
  parseFilter(filter: Record<string, unknown>): IFilter;
  validateFilter(filter: IFilter): boolean;
}

export type FilterOperator = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin' | '$regex' | '$exists' | '$elemMatch';
