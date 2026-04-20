"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { PlayerSearchResult, PlayerPositions } from "@/entities/player/ranking";

type SavedPlayer = { id: string; fullName: string; alias: string | null };

type Props = {
  city: string;
  leagueId?: string;
};

const STORAGE_KEY = "ranking_my_player";

export default function PlayerSearch({ city, leagueId }: Props) {
  const [saved, setSaved] = useState<SavedPlayer | null>(null);
  const [positions, setPositions] = useState<PlayerPositions | null>(null);
  const [loadingPos, setLoadingPos] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Read localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const player: SavedPlayer = JSON.parse(raw);
        setSaved(player);
        fetchPositions(player.id);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch positions when scope context changes (city / leagueId)
  useEffect(() => {
    if (saved) fetchPositions(saved.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, leagueId]);

  async function fetchPositions(playerId: string) {
    setLoadingPos(true);
    const params = new URLSearchParams({ playerId });
    if (city) params.set("city", city);
    if (leagueId) params.set("leagueId", leagueId);
    try {
      const res = await fetch(`/api/ranking/position?${params}`);
      const data = await res.json();
      if (data.ok) setPositions(data.data as PlayerPositions);
    } finally {
      setLoadingPos(false);
    }
  }

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}&mode=disambiguation`);
        const data = await res.json();
        setResults(data.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function select(player: PlayerSearchResult) {
    const toSave: SavedPlayer = { id: player.playerId, fullName: player.fullName, alias: player.alias };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setSaved(toSave);
    setShowSearch(false);
    setQuery("");
    setResults([]);
    fetchPositions(player.playerId);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    setSaved(null);
    setPositions(null);
    setShowSearch(false);
    setQuery("");
    setResults([]);
  }

  function openSearch() {
    setShowSearch(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Position card (when player is saved) ────────────────────────────────────
  if (saved && !showSearch) {
    return (
      <div className="bg-brand/10 border border-brand/30 rounded-2xl px-4 py-3.5 mb-4">

        {/* Player identity */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-sm shrink-0">
              {(saved.alias ?? saved.fullName).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-2">Tu perfil</p>
              <p className="text-sm font-semibold text-ink truncate leading-tight">
                {saved.alias ? `"${saved.alias}" · ` : ""}{saved.fullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={openSearch}
              className="text-xs text-ink-3 hover:text-ink px-2 py-1 rounded-lg hover:bg-surface-2 transition"
            >
              Cambiar
            </button>
            <button
              onClick={clear}
              className="text-ink-3 hover:text-ink p-1 rounded-lg hover:bg-surface-2 transition"
              aria-label="Quitar perfil"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Positions */}
        {loadingPos ? (
          <div className="h-12 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : positions ? (
          <div className={`grid gap-2 ${positions.league ? "grid-cols-3" : "grid-cols-2"}`}>
            {positions.league && (
              <PositionBadge
                label="Esta liga"
                rank={positions.league.rank}
                total={positions.league.total}
                goals={positions.league.goals}
              />
            )}
            {positions.city && (
              <PositionBadge
                label={positions.city.cityName}
                rank={positions.city.rank}
                total={positions.city.total}
                goals={positions.city.goals}
              />
            )}
            <PositionBadge
              label="México"
              rank={positions.global.rank}
              total={positions.global.total}
              goals={positions.global.goals}
            />
          </div>
        ) : null}
      </div>
    );
  }

  // ── Search panel ─────────────────────────────────────────────────────────────
  if (showSearch) {
    return (
      <div className="mb-4">
        <div className="relative">
          <Search
            size={15} strokeWidth={2.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe tu nombre o apodo…"
            className="w-full bg-surface-2 border border-line rounded-2xl pl-11 pr-11 py-3.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
          />
          <button
            onClick={() => { setShowSearch(false); setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 rounded-lg transition"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Results */}
        {searching && (
          <p className="text-xs text-ink-3 text-center py-4">Buscando…</p>
        )}

        {!searching && query.length >= 2 && results.length === 0 && (
          <p className="text-xs text-ink-3 text-center py-4">
            No se encontraron jugadores para &quot;{query}&quot;.
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-2 space-y-2">
            {results.map((player) => (
              <DisambiguationCard key={player.playerId} player={player} onSelect={select} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Default: "find me" prompt ────────────────────────────────────────────────
  return (
    <button
      onClick={openSearch}
      className="w-full flex items-center gap-3 bg-surface-2 border border-line hover:border-brand rounded-2xl px-4 py-3 mb-4 transition group"
    >
      <Search size={15} className="text-ink-3 group-hover:text-brand transition shrink-0" strokeWidth={2.5} />
      <span className="text-sm text-ink-3 group-hover:text-ink transition">
        ¿Dónde estoy en el ranking?
      </span>
    </button>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PositionBadge({
  label, rank, total, goals,
}: {
  label: string; rank: number; total: number; goals: number;
}) {
  const isTop10 = rank <= 10;
  return (
    <div className="bg-surface rounded-xl px-3 py-2 text-center">
      <p className={`font-display font-black text-xl leading-none ${isTop10 ? "text-brand" : "text-ink"}`}>
        #{rank}
      </p>
      <p className="text-[10px] text-ink-3 mt-0.5">de {total}</p>
      <p className="text-[10px] text-brand font-semibold mt-1">{goals} goles</p>
      <p className="text-[10px] text-ink-3 truncate mt-0.5">{label}</p>
    </div>
  );
}

function DisambiguationCard({
  player, onSelect,
}: {
  player: PlayerSearchResult;
  onSelect: (p: PlayerSearchResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const showToggle = player.participations.length > 1;

  // Unique cities
  const cities = [...new Set(player.participations.map((p) => p.city))];

  return (
    <button
      onClick={() => onSelect(player)}
      className="w-full text-left bg-surface-2 border border-line hover:border-brand rounded-2xl px-4 py-3.5 transition"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-sm shrink-0">
              {(player.alias ?? player.fullName).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink leading-tight">
                {player.fullName}
                {player.alias && (
                  <span className="text-brand ml-1.5 font-normal">&quot;{player.alias}&quot;</span>
                )}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-ink-3 shrink-0" />
                <p className="text-xs text-ink-3">{cities.join(" · ")}</p>
              </div>
            </div>
          </div>

          {/* First participation (always shown) */}
          {player.participations[0] && (
            <p className="text-xs text-ink-2 mt-2 ml-10">
              {player.participations[0].teamName} · {player.participations[0].leagueName} · {player.participations[0].season}
            </p>
          )}

          {/* Extra participations */}
          {expanded && player.participations.slice(1).map((p, i) => (
            <p key={i} className="text-xs text-ink-2 mt-1 ml-10">
              {p.teamName} · {p.leagueName} · {p.season} · {p.city}
            </p>
          ))}
        </div>

        <div className="text-right shrink-0">
          <p className="font-display font-black text-xl text-brand leading-none">{player.totalGoals}</p>
          <p className="text-[10px] text-ink-3">goles</p>
        </div>
      </div>

      {/* Toggle extra leagues */}
      {showToggle && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="flex items-center gap-1 text-[11px] text-brand mt-2 ml-10 hover:underline"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded
            ? "Ver menos"
            : `+${player.participations.length - 1} liga${player.participations.length - 1 !== 1 ? "s" : ""} más`}
        </button>
      )}
    </button>
  );
}
