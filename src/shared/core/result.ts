import type { AppError } from "./errors";

/**
 * Explicit success/failure envelope used by every use case.
 * Use cases never throw for expected outcomes, they return a Result.
 */
export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const success = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const failure = <E extends AppError>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export const isSuccess = <T, E>(
  result: Result<T, E>,
): result is { ok: true; value: T } => result.ok;

export const isFailure = <T, E>(
  result: Result<T, E>,
): result is { ok: false; error: E } => !result.ok;
