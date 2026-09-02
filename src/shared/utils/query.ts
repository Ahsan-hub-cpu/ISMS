export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Builds a link that keeps the current filters and changes only what is given,
 * which is what pagination and facet links need.
 */
export const hrefBuilder =
  (basePath: string, current: SearchParams) =>
  (overrides: Record<string, string | undefined>): string => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(current)) {
      if (typeof value === "string" && value) search.set(key, value);
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }

    const queryString = search.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

/** Falls back to schema defaults so a malformed URL never breaks a page. */
export const parseQuery = <T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T }; parse: (input: unknown) => T },
  params: SearchParams,
): T => {
  const parsed = schema.safeParse(params);
  return parsed.success && parsed.data ? parsed.data : schema.parse({});
};
