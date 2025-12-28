/**
 * Result type for type-safe error handling.
 * Replaces throwing exceptions with explicit error handling.
 *
 * @template T - The success data type
 * @template E - The error type (defaults to Error)
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return { success: false, error: 'Division by zero' };
 *   }
 *   return { success: true, data: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.success) {
 *   console.log(result.data); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

/**
 * Helper to create successful Result
 */
export const ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
})

/**
 * Helper to create failed Result
 */
export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
})

/**
 * Type guard to check if Result is successful
 */
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success === true
}

/**
 * Type guard to check if Result is an error
 */
export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return result.success === false
}

/**
 * Unwrap Result or throw error
 * Use only when you're certain the result is successful
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.success) {
    return result.data
  }
  throw result.error
}

/**
 * Get data or default value
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.success ? result.data : defaultValue
}

/**
 * Map over successful Result
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> => {
  return result.success ? ok(fn(result.data)) : result
}

/**
 * FlatMap over successful Result (useful for chaining)
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => {
  return result.success ? fn(result.data) : result
}

/**
 * Map over error Result
 */
export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  return result.success ? result : err(fn(result.error))
}
