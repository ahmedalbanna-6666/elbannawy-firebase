export * from "./repositories/base/base-repository";
export * from "./repositories/contracts";
export * from "./repositories/errors";
export * from "./repositories/query-builder";
export * from "./repositories/mappers/firestore-mapper";
export * from "./repositories/validators";
export * from "./repositories/user";
export * from "./repositories/curriculum";
export * from "./repositories/units";
export * from "./repositories/lessons";
export * from "./repositories/activities";
export * from "./repositories/vocabulary";
export * from "./repositories/teacher";
export * from "./repositories/live";
export * from "./repositories/stories";
export * from "./repositories/final-reviews";
export * from "./repositories/coins";
export * from "./repositories/notifications";
export * from "./repositories/reports";
export * from "./repositories/payments";
export * from "./repositories/subscriptions";
export * from "./repositories/competitions";
export * from "./repositories/support";
export * from "./repositories/gamification";
export * from "./services/user";
export * from "./services/curriculum";
export * from "./services/units";
export * from "./services/lessons";
export * from "./services/activities";
export * from "./domain";
export * from "./activities";
export * from "./engine";
export * from "./vocabulary-import";
export * from "./services/vocabulary-import";
export * from "./services/homework";
export { QuizService } from "./services/quiz/quiz.service";
export * from "./services/gamification";
export * from "./services/question-import";
export * from "./question-import";

export type {
  RepositoryResult,
  RepositoryError,
  IQueryFilter,
} from "./shared/types/repository.types";
export type {
  Page,
  PageQuery,
  IPaginationMeta,
  IPaginatedResponse,
} from "./shared/types/pagination.types";
export * from "./services/teacher";
export * from "./services/subscriptions";
export { FcmNotificationService } from "./services/fcm-notification.service";
export { NotificationDispatcher } from "./services/notification-dispatcher.service";

export type {
  ICursor,
  ICursorPagination,
  ICursorBuilder,
  IQueryOptions,
} from "./shared/types/cursor.types";
export type {
  IFilter,
  IFilterCondition,
  IQueryFilterBuilder,
  FilterOperator,
} from "./shared/types/filter.types";
