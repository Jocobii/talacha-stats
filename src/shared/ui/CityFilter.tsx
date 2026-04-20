"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
import { MapPin } from "lucide-react";

function CityFilterInner() {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const current  = params.get("city") ?? "Tijuana";

  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.data)) setCities(d.data); });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set("city", e.target.value);
    router.push(`${pathname}?${next.toString()}`);
  }

  // While loading, show a non-interactive label so layout doesn't shift
  if (cities.length === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-ink-3 shrink-0" strokeWidth={2.5} />
        <span className="bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5">
          {current}
        </span>
      </div>
    );
  }

  // If the current city isn't in the list (e.g. stale URL), show it anyway so the
  // select doesn't show a blank value — the user can then pick a valid one.
  const options = cities.includes(current) ? cities : [current, ...cities];

  return (
    <div className="flex items-center gap-1.5">
      <MapPin size={12} className="text-ink-3 shrink-0" strokeWidth={2.5} />
      <select
        value={current}
        onChange={handleChange}
        className="bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
      >
        {options.map((c) => (
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
          Ciudad
        </span>
      </div>
    }>
      <CityFilterInner />
    </Suspense>
  );
}
