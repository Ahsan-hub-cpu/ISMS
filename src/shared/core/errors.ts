export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_ERROR";

export interface FieldIssue {
  readonly field: string;
  readonly message: string;
}

/** Transport-agnostic application error. The API layer maps it to HTTP. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly issues: readonly FieldIssue[];

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    issues: readonly FieldIssue[] = [],
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.issues = issues;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The submitted data is invalid.", issues: readonly FieldIssue[] = []) {
    super("VALIDATION_ERROR", message, 422, issues);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(
      "NOT_FOUND",
      identifier ? `${resource} '${identifier}' was not found.` : `${resource} was not found.`,
      404,
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required.") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super("FORBIDDEN", message, 403);
  }
}

export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred.") {
    super("INTERNAL_ERROR", message, 500);
  }
}
