/**
 * Error Handling Utilities
 * Centralized error handling and reporting
 */

import { logger } from '@/lib/logger'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Handle and log errors
 */
export function handleError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof AppError) {
    logger.error(error.message, error, context)
  } else if (error instanceof Error) {
    logger.error(error.message, error, context)
  } else {
    logger.error('Unknown error occurred', new Error(String(error)), context)
  }
}

/**
 * Convert error to user-friendly Georgian message
 */
export function getGeorgianErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return 'გთხოვთ შეამოწმოთ შეყვანილი მონაცემები'
  }

  if (error instanceof AuthenticationError) {
    return 'გთხოვთ გაიაროთ ავტორიზაცია'
  }

  if (error instanceof AuthorizationError) {
    return 'თქვენ არ გაქვთ საკმარისი უფლებები'
  }

  if (error instanceof NotFoundError) {
    return 'მონაცემები ვერ მოიძებნა'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'დაფიქსირდა შეცდომა, გთხოვთ სცადოთ ხელახლა'
}
