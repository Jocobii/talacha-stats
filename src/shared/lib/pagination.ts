import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMeta;
};

// ── Validation schema ─────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: Partial<PaginationParams> = {}
): PaginationParams {
  const raw = {
    page:  searchParams.get("page")  ?? String(defaults.page  ?? 1),
    limit: searchParams.get("limit") ?? String(defaults.limit ?? 20),
  };
  const parsed = PaginationSchema.safeParse(raw);
  return parsed.success ? parsed.data : { page: defaults.page ?? 1, limit: defaults.limit ?? 20 };
}

export function toOffset({ page, limit }: PaginationParams): number {
  return (page - 1) * limit;
}

export function buildMeta(total: number, params: PaginationParams): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  return {
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

// For queries that fetch all rows in JS (small bounded datasets or aggregations
// that require in-memory grouping). Use SQL-level pagination when possible.
export function paginateArray<T>(array: T[], params: PaginationParams): PaginatedResult<T> {
  const offset = toOffset(params);
  return {
    items: array.slice(offset, offset + params.limit),
    meta:  buildMeta(array.length, params),
  };
}
