import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  /** Path and existing query string, without the page parameter. */
  buildHref: (page: number) => string;
}

const linkClass =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-border-strong bg-surface-raised px-3 text-[0.8125rem] font-medium transition-colors";
const activeClass = "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-brand-950/50";

export const Pagination = ({ page, totalPages, total, buildHref }: PaginationProps) => (
  <div className="flex items-center justify-between gap-4 border-t border-surface-border px-1 pt-4">
    <p className="text-xs text-content-muted">
      Page <span className="font-semibold tabular-nums text-content">{page}</span> of{" "}
      <span className="font-semibold tabular-nums text-content">{totalPages}</span>
      <span className="mx-1.5 text-content-subtle">·</span>
      <span className="font-semibold tabular-nums text-content">{total}</span> control
      {total === 1 ? "" : "s"}
    </p>

    <div className="flex items-center gap-2">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={cn(linkClass, activeClass)} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Link>
      ) : (
        <span className={cn(linkClass, "cursor-not-allowed opacity-40")}>
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </span>
      )}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={cn(linkClass, activeClass)} rel="next">
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(linkClass, "cursor-not-allowed opacity-40")}>
          Next
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </div>
  </div>
);
