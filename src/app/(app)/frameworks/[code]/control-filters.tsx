"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  CONTROL_TYPES,
  CYBERSECURITY_CONCEPTS,
  SECURITY_PROPERTIES,
} from "@/modules/framework/domain/attributes";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Filters live in the URL so a filtered catalogue view can be shared, bookmarked
 * and rendered on the server without any client-side data fetching.
 */
export const ControlFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const [searchDraft, setSearchDraft] = useState(currentSearch);
  const [syncedSearch, setSyncedSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adjusting state during render is the supported way to follow a changed
  // prop; it keeps the input in step when the URL changes (for example Clear).
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

  // Debouncing in the change handler avoids an effect that would re-run on every
  // keystroke and fight with the URL as the source of truth.
  const handleSearchChange = (value: string) => {
    setSearchDraft(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyParam("search", value.trim()), SEARCH_DEBOUNCE_MS);
  };

  const hasFilters = ["search", "themeCode", "controlType", "securityProperty", "cybersecurityConcept"].some(
    (key) => searchParams.get(key),
  );

  const selectValue = (key: string) => searchParams.get(key) ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2" data-pending={isPending ? "" : undefined}>
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-muted"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search controls"
          placeholder="Search by code, title or wording…"
          className="pl-9"
          value={searchDraft}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
      </div>

      <Select
        aria-label="Filter by control type"
        className="h-10 w-44"
        value={selectValue("controlType")}
        onChange={(event) => applyParam("controlType", event.target.value)}
      >
        <option value="">Any control type</option>
        {CONTROL_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by security property"
        className="h-10 w-44"
        value={selectValue("securityProperty")}
        onChange={(event) => applyParam("securityProperty", event.target.value)}
      >
        <option value="">Any property</option>
        {SECURITY_PROPERTIES.map((property) => (
          <option key={property} value={property}>
            {property}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by cybersecurity concept"
        className="h-10 w-40"
        value={selectValue("cybersecurityConcept")}
        onChange={(event) => applyParam("cybersecurityConcept", event.target.value)}
      >
        <option value="">Any concept</option>
        {CYBERSECURITY_CONCEPTS.map((concept) => (
          <option key={concept} value={concept}>
            {concept}
          </option>
        ))}
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={() => startTransition(() => router.replace(pathname))}>
          <X className="size-4" aria-hidden />
          Clear
        </Button>
      ) : null}
    </div>
  );
};
