"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/shared/lib/pagination";

// Builds the href for a given page number, preserving all other search params.
function usePageHref() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  return (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };
}

// Returns a compact list of page numbers to show:
// always first, last, current ±1 — gaps filled with ellipsis markers (null).
function buildPageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const set = new Set([1, total, current - 1, current, current + 1].filter(n => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);

  const result: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null); // ellipsis
    result.push(sorted[i]);
  }
  return result;
}

type Props = {
  meta: PaginationMeta;
  /** Override how page links are built (useful for non-URL-based navigation). */
  buildHref?: (page: number) => string;
  className?: string;
};

export default function Pagination({ meta, buildHref, className = "" }: Props) {
  const defaultBuildHref = usePageHref();
  const href = buildHref ?? defaultBuildHref;

  if (meta.totalPages <= 1) return null;

  const pages = buildPageWindow(meta.page, meta.totalPages);

  const linkBase =
    "flex items-center justify-center h-9 min-w-[2.25rem] px-2 rounded-lg text-sm font-medium transition select-none";
  const activeLink = `${linkBase} bg-brand text-pitch font-bold cursor-default`;
  const normalLink = `${linkBase} border border-line text-ink-2 hover:border-brand hover:text-ink`;
  const disabledLink = `${linkBase} border border-line text-ink-3 opacity-40 pointer-events-none`;

  return (
    <nav
      aria-label="Paginación"
      className={`flex items-center justify-center gap-1 flex-wrap ${className}`}
    >
      {/* Prev */}
      {meta.hasPrev ? (
        <Link href={href(meta.page - 1)} className={normalLink} aria-label="Página anterior">
          <ChevronLeft size={15} strokeWidth={2.5} />
        </Link>
      ) : (
        <span className={disabledLink} aria-disabled>
          <ChevronLeft size={15} strokeWidth={2.5} />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === null ? (
          <span key={`ellipsis-${i}`} className="flex items-center justify-center h-9 w-6 text-ink-3 text-sm select-none">
            …
          </span>
        ) : p === meta.page ? (
          <span key={p} className={activeLink} aria-current="page">{p}</span>
        ) : (
          <Link key={p} href={href(p)} className={normalLink}>{p}</Link>
        )
      )}

      {/* Next */}
      {meta.hasNext ? (
        <Link href={href(meta.page + 1)} className={normalLink} aria-label="Página siguiente">
          <ChevronRight size={15} strokeWidth={2.5} />
        </Link>
      ) : (
        <span className={disabledLink} aria-disabled>
          <ChevronRight size={15} strokeWidth={2.5} />
        </span>
      )}
    </nav>
  );
}
