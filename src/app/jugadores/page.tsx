"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Users, ArrowLeft, ChevronRight } from "lucide-react";
import CityFilter from "@/shared/ui/CityFilter";

type Player = {
  id: string;
  fullName: string;
  alias: string | null;
};

export default function JugadoresPage() {
  const [query,   setQuery]   = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    const url = q.trim()
      ? `/api/players?q=${encodeURIComponent(q.trim())}`
      : `/api/players`;
    const res  = await fetch(url);
    const data = await res.json();
    setPlayers(data.data ?? []);
    setFetched(true);
    setLoading(false);
  }, []);

  useEffect(() => { search(""); }, [search]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div className="min-h-screen bg-pitch text-ink font-body">

      {/* Header */}
      <header className="bg-pitch px-5 pt-8 pb-6 max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Inicio
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={22} className="text-brand" strokeWidth={2.5} />
              <h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
                Jugadores
              </h1>
            </div>
            <p className="text-ink-2 text-sm mt-0.5">
              Busca a un jugador y mira su perfil completo
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <CityFilter />
          </div>
        </div>
      </header>

      {/* Cuerpo */}
      <div className="bg-surface min-h-screen rounded-t-3xl px-4 pt-6 pb-16">
        <div className="max-w-lg mx-auto space-y-3">

          {/* Buscador */}
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2.5}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nombre o apodo…"
              className="w-full bg-surface-2 border border-line rounded-2xl pl-11 pr-4 py-3.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
            />
          </div>

          {/* Estado */}
          {loading && (
            <p className="text-center text-sm text-ink-3 py-6">Buscando…</p>
          )}

          {!loading && fetched && players.length === 0 && (
            <p className="text-center text-sm text-ink-3 py-6">
              No se encontraron jugadores{query ? ` para "${query}"` : ""}.
            </p>
          )}

          {/* Lista */}
          {!loading && players.map((p) => (
            <Link
              key={p.id}
              href={`/jugador/${p.id}`}
              className="flex items-center gap-4 bg-surface-2 border border-line rounded-2xl px-4 py-3.5 hover:border-brand transition"
            >
              <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-lg shrink-0">
                {(p.alias ?? p.fullName).charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink truncate">{p.fullName}</p>
                {p.alias && (
                  <p className="text-sm text-brand truncate">"{p.alias}"</p>
                )}
              </div>

              <ChevronRight size={16} className="text-ink-3 shrink-0" strokeWidth={2} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
