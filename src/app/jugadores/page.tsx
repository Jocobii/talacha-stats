"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

  // Carga inicial
  useEffect(() => { search(""); }, [search]);

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <header className="bg-gray-950 px-5 pt-8 pb-6 max-w-lg mx-auto">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition block mb-4">
          ← Inicio
        </Link>
        <h1 className="text-2xl font-black text-white">Jugadores</h1>
        <p className="text-gray-400 text-sm mt-1">Busca a un jugador y mira su perfil completo</p>
      </header>

      {/* Cuerpo */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl px-4 pt-6 pb-16">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nombre o apodo…"
              className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            />
          </div>

          {/* Lista */}
          {loading && (
            <p className="text-center text-sm text-gray-400 py-6">Buscando…</p>
          )}

          {!loading && fetched && players.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">
              No se encontraron jugadores{query ? ` para "${query}"` : ""}.
            </p>
          )}

          {!loading && players.map((p) => (
            <Link
              key={p.id}
              href={`/jugador/${p.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md transition"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center text-white font-black text-lg shrink-0">
                {(p.alias ?? p.fullName).charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{p.fullName}</p>
                {p.alias && (
                  <p className="text-sm text-green-600 truncate">"{p.alias}"</p>
                )}
              </div>

              <span className="ml-auto text-gray-300 shrink-0">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
