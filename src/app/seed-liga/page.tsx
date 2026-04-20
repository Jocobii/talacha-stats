"use client";

import { useState } from "react";
import Link from "next/link";
import { MEXICO_CITIES } from "@/shared/lib/cities";

type FormState = {
  city:              string;
  name:              string;
  dayOfWeek:         string;
  season:            string;
  numTeams:          number;
  numPlayersPerTeam: number;
  jornada:           number;
};

type StandingRow = {
  position: number;
  name: string;
  zone: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

type SeedResult = {
  leagueId:         string;
  leagueName:       string;
  city:             string;
  season:           string;
  jornada:          number;
  teamsCreated:     number;
  playersCreated:   number;
  totalGoalsLeague: number;
  topScorerGoals:   number;
  leader: {
    name: string; points: number; played: number;
    wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number;
  };
  standings: StandingRow[];
};

const DAYS = [
  { value: "lunes",     label: "Lunes" },
  { value: "martes",    label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves",    label: "Jueves" },
  { value: "viernes",   label: "Viernes" },
  { value: "sabado",    label: "Sábado" },
  { value: "domingo",   label: "Domingo" },
];

const ZONE_STYLES: Record<string, string> = {
  LIGUILLA: "bg-yellow-100 text-yellow-800",
  COPA:     "bg-blue-100 text-blue-700",
  RECOPA:   "bg-purple-100 text-purple-700",
};

const DEFAULT_FORM: FormState = {
  city:              "Tijuana",
  name:              "",
  dayOfWeek:         "lunes",
  season:            "Apertura 2025",
  numTeams:          10,
  numPlayersPerTeam: 8,
  jornada:           16,
};

export default function SeedLigaPage() {
  const [form,    setForm]    = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [result,  setResult]  = useState<SeedResult | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("El nombre de la liga es obligatorio."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res  = await fetch("/api/seed-liga", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Error al generar la liga.");
      } else {
        setResult(data.data as SeedResult);
      }
    } catch {
      setError("Error de red. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setForm(DEFAULT_FORM);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-mono">
            herramienta interna
          </p>
          <h1 className="text-3xl font-bold text-white">Poblar Liga</h1>
          <p className="text-gray-400 text-sm mt-1">
            Genera una liga completa con datos simulados realistas para demo.
          </p>
        </div>

        {!result ? (
          /* ---------------------------------------------------------------- */
          /* FORM                                                               */
          /* ---------------------------------------------------------------- */
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Liga */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Liga
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Liga Lunes Premium"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Ciudad</label>
                  <select
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    {MEXICO_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Día de semana</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => set("dayOfWeek", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Temporada</label>
                  <input
                    type="text"
                    value={form.season}
                    onChange={(e) => set("season", e.target.value)}
                    placeholder="Apertura 2025"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            </section>

            {/* Simulación */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Simulación
              </h2>

              <SliderField
                label="Equipos"
                value={form.numTeams}
                min={6} max={16} step={1}
                description={`${form.numTeams} equipos · ${form.numTeams * form.numPlayersPerTeam} jugadores totales`}
                onChange={(v) => set("numTeams", v)}
              />

              <SliderField
                label="Jugadores por equipo"
                value={form.numPlayersPerTeam}
                min={7} max={14} step={1}
                description={`${form.numPlayersPerTeam} jugadores × ${form.numTeams} equipos = ${form.numTeams * form.numPlayersPerTeam} totales`}
                onChange={(v) => set("numPlayersPerTeam", v)}
              />

              <SliderField
                label="Jornada actual"
                value={form.jornada}
                min={13} max={20} step={1}
                description={`Jornada ${form.jornada} — aprox. ${form.numTeams / 2 * form.jornada} partidos simulados`}
                onChange={(v) => set("jornada", v)}
              />
            </section>

            {/* Resumen visual antes de enviar */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 flex flex-wrap gap-6 text-sm">
              <Stat label="Equipos"   value={String(form.numTeams)} />
              <Stat label="Jugadores" value={String(form.numTeams * form.numPlayersPerTeam)} />
              <Stat label="Jornada"   value={String(form.jornada)} />
              <Stat label="Partidos"  value={String(Math.floor(form.numTeams / 2) * form.jornada)} />
              <Stat label="Ciudad"    value={form.city} />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              {loading ? "Generando liga…" : "Generar Liga"}
            </button>

            {loading && (
              <div className="text-center">
                <div className="inline-flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400">
                    Simulando partidos y distribuyendo goles…
                  </p>
                </div>
              </div>
            )}
          </form>

        ) : (
          /* ---------------------------------------------------------------- */
          /* RESULT                                                             */
          /* ---------------------------------------------------------------- */
          <div className="space-y-6">

            {/* Success header */}
            <div className="bg-green-900/30 border border-green-800 rounded-2xl px-6 py-5">
              <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Liga generada exitosamente
              </p>
              <h2 className="text-2xl font-bold text-white">{result.leagueName}</h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {result.city} · {result.season} · Jornada {result.jornada}
              </p>
            </div>

            {/* Resumen numérico */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ResultStat label="Equipos"       value={String(result.teamsCreated)} />
              <ResultStat label="Jugadores"     value={String(result.playersCreated)} />
              <ResultStat label="Goles (liga)"  value={String(result.totalGoalsLeague)} />
              <ResultStat label="Top goleador"  value={`${result.topScorerGoals} goles`} />
            </div>

            {/* Tabla de posiciones */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300">Tabla de posiciones — Jornada {result.jornada}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-800/60 text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left w-6">#</th>
                      <th className="px-4 py-2.5 text-left">Equipo</th>
                      <th className="px-3 py-2.5 text-center">PJ</th>
                      <th className="px-3 py-2.5 text-center">G</th>
                      <th className="px-3 py-2.5 text-center">E</th>
                      <th className="px-3 py-2.5 text-center">P</th>
                      <th className="px-3 py-2.5 text-center">GF</th>
                      <th className="px-3 py-2.5 text-center">GC</th>
                      <th className="px-3 py-2.5 text-center">DG</th>
                      <th className="px-3 py-2.5 text-center font-bold">Pts</th>
                      <th className="px-3 py-2.5 text-center">Zona</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {result.standings.map((row) => (
                      <tr key={row.name} className="hover:bg-gray-800/40">
                        <td className="px-4 py-2.5 text-gray-500">{row.position}</td>
                        <td className="px-4 py-2.5 font-medium text-white">{row.name}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{row.played}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{row.wins}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{row.draws}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{row.losses}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{row.goalsFor}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{row.goalsAgainst}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">
                          {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}
                          {row.goalsFor - row.goalsAgainst}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-white">{row.points}</td>
                        <td className="px-3 py-2.5 text-center">
                          {row.zone ? (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ZONE_STYLES[row.zone] ?? "bg-gray-700 text-gray-300"}`}>
                              {row.zone}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/admin/leagues/${result.leagueId}`}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold text-center py-3 rounded-xl transition"
              >
                Ver liga en admin →
              </Link>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold py-3 rounded-xl transition"
              >
                Generar otra liga
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function SliderField({
  label, value, min, max, step, description, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  description: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-gray-400">{label}</label>
        <span className="text-sm font-bold text-white tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-green-500"
      />
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
