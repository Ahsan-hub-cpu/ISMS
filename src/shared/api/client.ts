import type { FieldIssue } from "@/shared/core/errors";

import type { ApiResponse } from "./http";

export interface ApiFailure {
  readonly message: string;
  readonly issues: readonly FieldIssue[];
}

export type ApiOutcome<T> = { ok: true; data: T } | { ok: false } & ApiFailure;

/**
 * Single place where client components talk to the API, so every form handles
 * validation issues and transport failures the same way.
 */
export const apiRequest = async <T>(
  url: string,
  init: RequestInit = {},
): Promise<ApiOutcome<T>> => {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    return { ok: false, message: "The server could not be reached. Check your connection.", issues: [] };
  }

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    return { ok: false, message: "The server returned an unexpected response.", issues: [] };
  }

  if (!response.ok || "error" in payload) {
    const error = "error" in payload ? payload.error : null;
    return {
      ok: false,
      message: error?.message ?? "Something went wrong.",
      issues: error?.issues ?? [],
    };
  }

  return { ok: true, data: payload.data };
};

export const postJson = <T>(url: string, body: unknown) =>
  apiRequest<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const patchJson = <T>(url: string, body: unknown) =>
  apiRequest<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
