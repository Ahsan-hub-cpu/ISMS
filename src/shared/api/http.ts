import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { AppError, InternalError, ValidationError, type FieldIssue } from "@/shared/core/errors";
import type { Result } from "@/shared/core/result";

export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly issues?: readonly FieldIssue[];
}

export type ApiResponse<T> = { readonly data: T } | { readonly error: ApiErrorBody };

export const jsonOk = <T>(data: T, status = 200) =>
  NextResponse.json<ApiResponse<T>>({ data }, { status });

export const jsonCreated = <T>(data: T) => jsonOk(data, 201);

export const jsonError = (error: AppError) =>
  NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.issues.length > 0 ? { issues: error.issues } : {}),
      },
    },
    { status: error.status },
  );

const zodIssues = (error: ZodError): FieldIssue[] =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "_root",
    message: issue.message,
  }));

/** Validates unknown input and throws a ValidationError the route layer can map. */
export const parseOrThrow = <T>(schema: ZodType<T>, input: unknown): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("The submitted data is invalid.", zodIssues(parsed.error));
  }
  return parsed.data;
};

export const parseJsonBody = async <T>(request: Request, schema: ZodType<T>): Promise<T> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
  return parseOrThrow(schema, body);
};

export const parseSearchParams = <T>(request: Request, schema: ZodType<T>): T =>
  parseOrThrow(schema, Object.fromEntries(new URL(request.url).searchParams));

const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new ValidationError("The submitted data is invalid.", zodIssues(error));
  }
  console.error("[api] Unhandled error", error);
  return new InternalError();
};

/**
 * Wraps a route handler so that every thrown error becomes a consistent JSON body.
 * Route handlers stay thin: parse input, call a use case, shape the response.
 */
export const withApiHandler =
  <Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) =>
  async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return jsonError(toAppError(error));
    }
  };

/** Turns a use case Result into an HTTP response. */
export const respond = <T>(result: Result<T>, status = 200): Response =>
  result.ok ? jsonOk(result.value, status) : jsonError(result.error);
