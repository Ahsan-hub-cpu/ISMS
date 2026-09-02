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

const linkClass = "inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-sm";

export const Pagination = ({ page, totalPages, total, buildHref }: PaginationProps) => (
  <div className="flex items-center justify-between gap-4 border-t px-1 pt-3">
    <p className="text-xs text-content-muted">
      Page {page} of {totalPages} · {total} control{total === 1 ? "" : "s"}
    </p>

    <div className="flex items-center gap-2">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={linkClass} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-40")}>
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </span>
      )}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={linkClass} rel="next">
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-40")}>
          Next
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </div>
  </div>
);
