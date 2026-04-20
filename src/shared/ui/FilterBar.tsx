"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

// ── Filter config types ───────────────────────────────────────────────────────

export type FilterOption = { value: string; label: string };

export type FilterField =
  | {
      type: "search";
      name: string;
      placeholder?: string;
      label?: string;
    }
  | {
      type: "select";
      name: string;
      label: string;
      placeholder?: string; // "Todas las ligas"
      options: FilterOption[];
    };

export type FilterBarProps = {
  fields: FilterField[];
  className?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FilterBar({ fields, className = "" }: FilterBarProps) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [isPending, startTransition] = useTransition();

  const applyFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset to page 1 whenever a filter changes
      params.set("page", "1");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const inputBase =
    "bg-pitch border border-line text-ink rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition placeholder:text-ink-3";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <SlidersHorizontal size={15} className={`text-ink-3 shrink-0 ${isPending ? "animate-pulse" : ""}`} strokeWidth={2} />

      {fields.map((field) => {
        const current = searchParams.get(field.name) ?? "";

        if (field.type === "search") {
          return (
            <div key={field.name} className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" strokeWidth={2} />
              <input
                type="search"
                placeholder={field.placeholder ?? "Buscar…"}
                defaultValue={current}
                aria-label={field.label ?? field.placeholder ?? "Buscar"}
                className={`${inputBase} pl-8 w-full`}
                onChange={(e) => applyFilter(field.name, e.target.value)}
              />
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <select
              key={field.name}
              value={current}
              aria-label={field.label}
              onChange={(e) => applyFilter(field.name, e.target.value)}
              className={`${inputBase} appearance-none cursor-pointer pr-8`}
            >
              <option value="">{field.placeholder ?? `— ${field.label} —`}</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }
      })}
    </div>
  );
}
