"use client";

import { useRouter } from "next/navigation";

type League = { id: string; name: string; dayOfWeek: string; season: string };

const DAY_LABELS: Record<string, string> = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom",
};

export default function LeagueSelector({
  leagues,
  city,
  current,
}: {
  leagues: League[];
  city:    string;
  current?: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/ranking?scope=league&city=${encodeURIComponent(city)}&leagueId=${e.target.value}&page=1`);
  }

  return (
    <div className="mb-4">
      <select
        value={current ?? ""}
        onChange={handleChange}
        className="w-full bg-surface-2 border border-line text-ink text-sm font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand appearance-none cursor-pointer"
      >
        <option value="" disabled>Selecciona una liga…</option>
        {leagues.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} · {DAY_LABELS[l.dayOfWeek] ?? l.dayOfWeek} · {l.season}
          </option>
        ))}
      </select>
    </div>
  );
}
