"use client";

import { useEffect, useState } from "react";
import { titleCase } from "@/shared/lib/normalize";

type League = {
  id: string;
  name: string;
  dayOfWeek: string;
  status: string;
};

type Props = {
  value: string;
  onChange: (leagueId: string) => void;
  /** Filtra ligas por ciudad y re-fetcha cuando cambia */
  city?: string;
  /** Sobrescribe las clases del <select> para páginas con estilos propios */
  selectClassName?: string;
  id?: string;
};

const DEFAULT_CLASS =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50";

export function LeagueSelect({ value, onChange, city, selectClassName, id }: Props) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const url = city ? `/api/leagues?city=${encodeURIComponent(city)}` : "/api/leagues";
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (!active) return;
        const all: League[] = d.data ?? [];
        setLeagues(all.filter(l => l.status === "active"));
        setLoading(false);
      });
    return () => { active = false; };
  }, [city]);

  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={loading}
      className={selectClassName ?? DEFAULT_CLASS}
    >
      {loading ? (
        <option value="">Cargando ligas…</option>
      ) : leagues.length === 0 ? (
        <>
          <option value="">No hay ligas activas</option>
        </>
      ) : (
        <>
          <option value="">— Seleccionar liga —</option>
          {leagues.map(l => (
            <option key={l.id} value={l.id}>
              {titleCase(l.name)} - {titleCase(l.dayOfWeek)}
            </option>
          ))}
        </>
      )}
    </select>
  );
}
