/**
 * Base error class for all service errors.
 * Provides structured error handling with error codes.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'ServiceError'

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    }
  }
}

/**
 * Product service specific errors
 */
export class ProductServiceError extends ServiceError {
  constructor(message: string, code: ProductErrorCode, originalError?: unknown) {
    super(message, code, 500, originalError)
    this.name = 'ProductServiceError'
  }
}

export enum ProductErrorCode {
  FETCH_FAILED = 'PRODUCT_FETCH_FAILED',
  NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INVALID_DATA = 'PRODUCT_INVALID_DATA',
  DATABASE_ERROR = 'PRODUCT_DATABASE_ERROR',
}

/**
 * Order service specific errors
 */
export class OrderServiceError extends ServiceError {
  constructor(
    message: string,
    code: OrderErrorCode,
    statusCode: number = 500,
    originalError?: unknown
  ) {
    super(message, code, statusCode, originalError)
    this.name = 'OrderServiceError'
  }
}

export enum OrderErrorCode {
  CREATION_FAILED = 'ORDER_CREATION_FAILED',
  INVALID_INPUT = 'ORDER_INVALID_INPUT',
  UNAUTHORIZED = 'ORDER_UNAUTHORIZED',
  ITEMS_REQUIRED = 'ORDER_ITEMS_REQUIRED',
  DATABASE_ERROR = 'ORDER_DATABASE_ERROR',
  ROLLBACK_FAILED = 'ORDER_ROLLBACK_FAILED',
  NOT_FOUND = 'ORDER_NOT_FOUND',
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends ServiceError {
  constructor(
    message: string,
    public readonly field?: string,
    originalError?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400, originalError)
    this.name = 'ValidationError'
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    }
  }
}

/**
 * Authentication/Authorization errors
 */
export class AuthError extends ServiceError {
  constructor(
    message: string,
    code: 'UNAUTHORIZED' | 'FORBIDDEN' = 'UNAUTHORIZED',
    originalError?: unknown
  ) {
    super(message, code, code === 'UNAUTHORIZED' ? 401 : 403, originalError)
    this.name = 'AuthError'
  }
}

/**
 * Helper to determine if error is a ServiceError
 */
export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError
}

/**
 * Helper to convert unknown errors to ServiceError
 */
export function toServiceError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): ServiceError {
  if (isServiceError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new ServiceError(error.message, 'UNKNOWN_ERROR', 500, error)
  }

  return new ServiceError(defaultMessage, 'UNKNOWN_ERROR', 500, error)
}
