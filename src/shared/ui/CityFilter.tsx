"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { MEXICO_CITIES } from "@/shared/lib/cities";

function CityFilterInner() {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const current  = params.get("city") ?? "Tijuana";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set("city", e.target.value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5">
      <MapPin size={12} className="text-ink-3 shrink-0" strokeWidth={2.5} />
      <select
        value={current}
        onChange={handleChange}
        className="bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
      >
        {MEXICO_CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}

export default function CityFilter() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-ink-3 shrink-0" strokeWidth={2.5} />
        <span className="bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5">
          Tijuana
        </span>
      </div>
    }>
      <CityFilterInner />
    </Suspense>
  );
}
