import { RepositoryError } from '../shared/types/repository.types';

export class ValidationError extends Error {
  readonly code = 'INVALID_INPUT' as const;

  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: false,
      requestId: requestId ?? '',
    } as RepositoryError;
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: false,
      requestId: requestId ?? '',
    };
  }
}

export class ConflictError extends Error {
  readonly code = 'CONFLICT' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: true,
      requestId: requestId ?? '',
    };
  }
}

export class PermissionDeniedError extends Error {
  readonly code = 'FORBIDDEN' as const;

  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: false,
      requestId: requestId ?? '',
    };
  }
}

export class ConcurrencyError extends Error {
  readonly code = 'PRECONDITION_FAILED' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: true,
      requestId: requestId ?? '',
    };
  }
}

export class TransactionError extends Error {
  readonly code = 'UNAVAILABLE' as const;

  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: true,
      requestId: requestId ?? '',
    };
  }
}

export class RateLimitError extends Error {
  readonly code = 'RATE_LIMITED' as const;

  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: false,
      requestId: requestId ?? '',
    };
  }
}

export class UnexpectedRepositoryError extends Error {
  readonly code = 'INTERNAL' as const;

  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'UnexpectedRepositoryError';
  }

  toRepositoryError(requestId?: string): RepositoryError {
    return {
      code: this.code,
      message: this.message,
      retryable: false,
      requestId: requestId ?? '',
    };
  }
}

export function fromError(error: Error): RepositoryError {
  if (error instanceof ValidationError) {
    return error.toRepositoryError();
  }
  if (error instanceof NotFoundError) {
    return error.toRepositoryError();
  }
  if (error instanceof ConflictError) {
    return error.toRepositoryError();
  }
  if (error instanceof PermissionDeniedError) {
    return error.toRepositoryError();
  }
  if (error instanceof ConcurrencyError) {
    return error.toRepositoryError();
  }
  if (error instanceof TransactionError) {
    return error.toRepositoryError();
  }
  if (error instanceof RateLimitError) {
    return error.toRepositoryError();
  }
  if (error instanceof UnexpectedRepositoryError) {
    return error.toRepositoryError();
  }

  return {
    code: 'INTERNAL',
    message: error.message,
    retryable: false,
    requestId: '',
  };
}
