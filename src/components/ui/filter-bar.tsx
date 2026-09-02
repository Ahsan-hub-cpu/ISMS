"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

export interface FilterDefinition {
  key: string;
  /** Shown as the "any value" option and as the accessible label. */
  label: string;
  options: readonly { value: string; label: string }[];
  className?: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  filters?: readonly FilterDefinition[];
}

/**
 * Keeps list filters in the URL so every filtered view is shareable and can be
 * rendered on the server without client-side data fetching.
 */
export const FilterBar = ({ searchPlaceholder, filters = [] }: FilterBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const [searchDraft, setSearchDraft] = useState(currentSearch);
  const [syncedSearch, setSyncedSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adjusting state during render keeps the input in step when the URL changes,
  // for example after Clear is pressed.
  if (currentSearch !== syncedSearch) {
    setSyncedSearch(currentSearch);
    setSearchDraft(currentSearch);
  }

  const applyParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");

    startTransition(() => {
      router.replace(params.size > 0 ? `${pathname}?${params}` : pathname, { scroll: false });
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyParam("search", value.trim()), SEARCH_DEBOUNCE_MS);
  };

  const activeKeys = ["search", ...filters.map((filter) => filter.key)];
  const hasFilters = activeKeys.some((key) => searchParams.get(key));

  return (
    <div className="flex flex-wrap items-center gap-2" data-pending={isPending ? "" : undefined}>
      {searchPlaceholder ? (
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-muted"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search"
            placeholder={searchPlaceholder}
            className="pl-9"
            value={searchDraft}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>
      ) : null}

      {filters.map((filter) => (
        <Select
          key={filter.key}
          aria-label={filter.label}
          className={filter.className ?? "h-10 w-48"}
          value={searchParams.get(filter.key) ?? ""}
          onChange={(event) => applyParam(filter.key, event.target.value)}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ))}

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => router.replace(pathname))}
        >
          <X className="size-4" aria-hidden />
          Clear
        </Button>
      ) : null}
    </div>
  );
};
