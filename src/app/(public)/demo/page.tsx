"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Star, BarChart3, User, ArrowLeft, ChevronRight } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const LIGA_JUEVES = { name: "Liga Compadres", day: "Jueves", season: "2025" };
const LIGA_LUNES = { name: "Liga Guerreros", day: "Lunes", season: "2025" };

const RANKING = [
  { id: "1", fullName: "Roberto Mendoza", alias: "El Toro", team: "Deportivo Azteca", league: LIGA_JUEVES, goals: 18, matches: 12, leagues: 2 },
  { id: "2", fullName: "Carlos Vega", alias: "Pichichi", team: "Los Guerreros", league: LIGA_JUEVES, goals: 15, matches: 11, leagues: 1 },
  { id: "3", fullName: "Jesús Rodríguez", alias: "La Máquina", team: "Real Colonia", league: LIGA_LUNES, goals: 13, matches: 10, leagues: 2 },
  { id: "4", fullName: "Marco Jiménez", alias: "El Rayo", team: "América TJ", league: LIGA_JUEVES, goals: 11, matches: 10, leagues: 1 },
  { id: "5", fullName: "Armando García", alias: null, team: "Tigres Norte", league: LIGA_LUNES, goals: 11, matches: 12, leagues: 1 },
  { id: "6", fullName: "Daniel López", alias: "Tecate", team: "Deportivo Azteca", league: LIGA_JUEVES, goals: 10, matches: 11, leagues: 1 },
  { id: "7", fullName: "Fernando Ruiz", alias: null, team: "Los Galácticos", league: LIGA_LUNES, goals: 9, matches: 10, leagues: 1 },
  { id: "8", fullName: "Miguel Torres", alias: "Mago", team: "Real Colonia", league: LIGA_LUNES, goals: 8, matches: 11, leagues: 2 },
];

const DEMO_PLAYER = {
  fullName: "Roberto Mendoza",
  alias: "El Toro",
  global: { goals: 23, matches: 19, leagues: 2, gpm: 1.21 },
  leagues: [
    { name: "Liga Compadres", day: "Jueves", season: "2025", team: "Deportivo Azteca", goals: 18, matches: 12, gpm: 1.50, yellows: 3, reds: 0 },
    { name: "Liga Veteranos", day: "Sábado", season: "2025", team: "Azteca Masters", goals: 5, matches: 7, gpm: 0.71, yellows: 1, reds: 0 },
  ],
};

const MATCHDAY = [
  {
    league: LIGA_JUEVES, jornada: 12,
    heroes: [
      { id: "1", fullName: "Roberto Mendoza", alias: "El Toro", team: "Deportivo Azteca", goals: 3, matches: 1, gpm: 3.0 },
      { id: "2", fullName: "Carlos Vega", alias: "Pichichi", team: "Los Guerreros", goals: 2, matches: 1, gpm: 2.0 },
      { id: "4", fullName: "Marco Jiménez", alias: "El Rayo", team: "América TJ", goals: 2, matches: 1, gpm: 2.0 },
    ],
  },
  {
    league: LIGA_LUNES, jornada: 11,
    heroes: [
      { id: "3", fullName: "Jesús Rodríguez", alias: "La Máquina", team: "Real Colonia", goals: 4, matches: 1, gpm: 4.0 },
      { id: "8", fullName: "Miguel Torres", alias: "Mago", team: "Real Colonia", goals: 2, matches: 1, gpm: 2.0 },
      { id: "7", fullName: "Fernando Ruiz", alias: null, team: "Los Galácticos", goals: 1, matches: 1, gpm: 1.0 },
    ],
  },
];

const ANALYSIS = {
  league: { name: "Liga Compadres", season: "2025", jornada: 12 },
  teamA: {
    name: "Deportivo Azteca",
    color: "blue" as const,
    position: 1,
    points: 26,
    record: { w: 8, d: 2, l: 2 },
    gf: 28, gc: 12, diff: 16, avg: 2.33,
    last5: ["W", "W", "W", "D", "W"] as const,
    streak: { type: "W" as const, count: 3 },
    attackRank: 1, defenseRank: 1, totalTeams: 8,
    topScorer: { name: "El Toro", goals: 18 },
    cardRisk: [{ player: "Daniel López", note: "4 amarillas" }],
    threats: [
      { name: "El Toro", goals: 18, gpm: 1.50, danger: "ALTO" },
      { name: "Tecate", goals: 10, gpm: 0.91, danger: "MEDIO" },
      { name: "Erick Soto", goals: 5, gpm: 0.50, danger: "BAJO" },
    ],
    roster: [
      { name: "El Toro", goals: 18, yellows: 3, reds: 0, pj: 12, danger: "ALTO" },
      { name: "Tecate", goals: 10, yellows: 2, reds: 0, pj: 11, danger: "MEDIO" },
      { name: "Erick Soto", goals: 5, yellows: 1, reds: 0, pj: 10, danger: "BAJO" },
      { name: "Andrés Mora", goals: 3, yellows: 0, reds: 0, pj: 10, danger: "BAJO" },
      { name: "Omar Vidal", goals: 2, yellows: 4, reds: 1, pj: 9, danger: "BAJO" },
    ],
  },
  teamB: {
    name: "Los Guerreros",
    color: "blue" as const,
    position: 2,
    points: 21,
    record: { w: 6, d: 3, l: 3 },
    gf: 20, gc: 16, diff: 4, avg: 1.67,
    last5: ["W", "W", "W", "D", "W"] as const,
    streak: { type: "W" as const, count: 1 },
    attackRank: 3, defenseRank: 4, totalTeams: 8,
    topScorer: { name: "Pichichi", goals: 15 },
    cardRisk: [{ player: "Hugo Ramos", note: "acumula 4" }],
    threats: [
      { name: "Pichichi", goals: 15, gpm: 1.36, danger: "ALTO" },
      { name: "Hugo Ramos", goals: 4, gpm: 0.40, danger: "BAJO" },
      { name: "Iván Flores", goals: 1, gpm: 0.10, danger: "BAJO" },
    ],
    roster: [
      { name: "Pichichi", goals: 15, yellows: 1, reds: 0, pj: 11, danger: "ALTO" },
      { name: "Hugo Ramos", goals: 4, yellows: 4, reds: 0, pj: 10, danger: "BAJO" },
      { name: "Iván Flores", goals: 1, yellows: 0, reds: 0, pj: 8, danger: "BAJO" },
      { name: "Saúl Pérez", goals: 0, yellows: 2, reds: 0, pj: 11, danger: "BAJO" },
    ],
  },
  prob: { a: 58, draw: 18, b: 24 },
  h2h: { aWins: 4, draws: 1, bWins: 2, total: 7, last: { a: 3, b: 1 } },
  prediction: { scoreA: 3, scoreB: 1, expA: 2.8, expB: 1.5, total: 4.3, label: "abierto" as const, bothScore: true, offEdge: "A" as const, defEdge: "A" as const },
  simulator: {
    a: { pos: 1, pts: 26, win: 1, draw: 1, loss: 1 },
    b: { pos: 2, pts: 21, win: 2, draw: 2, loss: 4 },
  },
  bullets: [
    "Deportivo Azteca llega como líder con 3 victorias al hilo — el equipo más en forma de la liga.",
    "El Toro Mendoza es la principal amenaza: 18 goles en 12 partidos, el mejor ratio de la temporada.",
    "Los Guerreros dependen casi exclusivamente de Pichichi Vega para marcar — si lo neutralizan, el partido cambia.",
    "Azteca tiene la mejor defensa de la liga, apenas 12 goles recibidos. Los Guerreros van a sufrir.",
    "Cuidado con Hugo Ramos: lleva 4 amarillas y está al borde de la suspensión.",
  ],
  funFacts: [
    "El Toro ha marcado en los últimos 7 partidos consecutivos.",
    "Azteca no ha perdido cuando anota primero (8 de 8).",
    "Los Guerreros ganaron el único partido donde Pichichi hizo doblete esta temporada.",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayName(p: { fullName: string; alias: string | null }) {
  return p.alias ? `"${p.alias}"` : p.fullName;
}

function initial(name: string, alias: string | null) {
  return (alias ?? name).charAt(0).toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "ranking" | "perfil" | "matchday" | "analisis";

const TABS: { id: Tab; label: string; icon: typeof Trophy }[] = [
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "perfil", label: "Perfil", icon: User },
  { id: "matchday", label: "Jornada", icon: Star },
  { id: "analisis", label: "Análisis", icon: BarChart3 },
];

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>("ranking");

  return (
    <div className="text-ink flex flex-col flex-1 min-h-screen">

      {/* Demo banner */}
      <div className="bg-brand text-pitch text-xs font-bold text-center py-2 px-4 uppercase tracking-widest">
        Demo interactivo · datos ficticios
      </div>

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between max-w-2xl mx-auto w-full border-b border-line">
        <div>
          <span className="font-display font-black text-xl uppercase tracking-widest text-ink">
            TalachaStats
          </span>
          <span className="ml-2 text-xs text-ink-3 font-medium">— Así se ve tu liga</span>
        </div>
        <Link href="/" className="text-ink-3 hover:text-ink text-sm transition flex items-center gap-1">
          <ArrowLeft size={14} /> Inicio
        </Link>
      </header>

      {/* Tabs */}
      <div className="border-b border-line bg-pitch sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition shrink-0
                ${tab === id
                  ? "border-brand text-brand"
                  : "border-transparent text-ink-3 hover:text-ink"}`}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {tab === "ranking" && <RankingTab onShowProfile={() => setTab("perfil")} />}
        {tab === "perfil" && <ProfileTab />}
        {tab === "matchday" && <MatchdayTab />}
        {tab === "analisis" && <AnalysisTab />}
      </div>

      {/* CTA */}
      <CtaFooter />
    </div>
  );
}

// ─── Ranking tab ──────────────────────────────────────────────────────────────

function RankingTab({ onShowProfile }: { onShowProfile: () => void }) {
  const top3 = RANKING.slice(0, 3);
  const rest = RANKING.slice(3);

  const podium = [
    { ...top3[1], pos: 2, medal: "🥈", size: "text-3xl", mt: "mt-6" },
    { ...top3[0], pos: 1, medal: "🥇", size: "text-5xl", mt: "" },
    { ...top3[2], pos: 3, medal: "🥉", size: "text-3xl", mt: "mt-6" },
  ];

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-pitch px-5 pt-8 pb-6 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={22} className="text-brand" strokeWidth={2.5} />
          <h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">Ranking</h1>
        </div>
        <p className="text-ink-2 text-sm">{RANKING.length} jugadores · Fútbol Amateur Tijuana</p>
      </div>

      <div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-10">
        <div className="max-w-lg mx-auto space-y-3">

          {/* Podium */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {podium.map((p) => (
              <button
                key={p.id}
                onClick={p.pos === 1 ? onShowProfile : undefined}
                className={`bg-surface-2 border border-line rounded-2xl flex flex-col items-center text-center px-2 py-4 ${p.mt}
                  ${p.pos === 1 ? "hover:border-brand cursor-pointer transition" : "cursor-default"}`}
              >
                <span className="text-xl mb-2">{p.medal}</span>
                <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-xl mb-2">
                  {initial(p.fullName, p.alias)}
                </div>
                <p className="text-xs font-semibold text-ink leading-tight line-clamp-2 w-full">
                  {p.alias ? `"${p.alias}"` : p.fullName}
                </p>
                <p className={`${p.size} font-display font-black text-brand mt-1 leading-none`}>{p.goals}</p>
                <p className="text-[10px] text-ink-3">goles</p>
                <p className="text-[10px] text-ink-3 mt-0.5">{(p.goals / p.matches).toFixed(2)}/PJ</p>
              </button>
            ))}
          </div>

          {rest.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 bg-surface-2 border border-line rounded-2xl px-4 py-3.5
                ${p.id === "1" ? "hover:border-brand cursor-pointer transition" : ""}`}
              onClick={p.id === "1" ? onShowProfile : undefined}
            >
              <div className="w-8 text-center shrink-0 font-display font-black text-xl text-ink-3">{i + 4}</div>
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-base shrink-0">
                {initial(p.fullName, p.alias)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate text-sm">{p.alias ? `"${p.alias}"` : p.fullName}</p>
                <p className="text-xs text-ink-2 truncate">
                  {p.team} · {p.league.name}
                  {p.leagues > 1 && <span className="ml-1 text-brand font-medium">+{p.leagues - 1} liga</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-black text-2xl text-brand leading-none">{p.goals}</p>
                <p className="text-[10px] text-ink-3">{(p.goals / p.matches).toFixed(2)}/PJ</p>
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-ink-3 pt-2">
            Toca al #1 para ver su perfil →
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const p = DEMO_PLAYER;
  return (
    <div className="flex flex-col flex-1">
      <div className="bg-gray-950 px-5 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-4xl font-black shrink-0 shadow-lg text-white">
              {p.alias.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight text-white">{p.fullName}</h1>
              <p className="text-green-400 text-lg font-semibold mt-0.5">&quot;{p.alias}&quot;</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Goles por partido</p>
              <p className="text-5xl font-black text-green-400 mt-1 leading-none">{p.global.gpm.toFixed(2)}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-gray-300 text-sm"><span className="text-white font-bold">{p.global.goals}</span> goles</p>
              <p className="text-gray-300 text-sm"><span className="text-white font-bold">{p.global.matches}</span> partidos</p>
              <p className="text-gray-300 text-sm"><span className="text-white font-bold">{p.global.leagues}</span> ligas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 flex-1 rounded-t-3xl px-5 pt-7 pb-10">
        <div className="max-w-lg mx-auto space-y-5">

          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center"><p className="text-2xl font-black text-green-600">{p.global.goals}</p><p className="text-[10px] text-gray-400 mt-0.5">Goles</p></div>
              <div className="text-center"><p className="text-2xl font-black text-gray-700">{p.global.matches}</p><p className="text-[10px] text-gray-400 mt-0.5">Partidos</p></div>
              <div className="text-center"><p className="text-2xl font-black text-purple-600">{p.global.leagues}</p><p className="text-[10px] text-gray-400 mt-0.5">Ligas</p></div>
            </div>
          </div>

          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ligas ({p.leagues.length})</h2>
            <div className="space-y-3">
              {p.leagues.map((l) => (
                <div key={l.name} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-1 bg-green-500" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{l.name}</p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">{l.day} · {l.season}</p>
                        <p className="text-sm text-gray-600 mt-1">{l.team}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-2xl font-black ${l.gpm >= 1 ? "text-green-600" : l.gpm >= 0.5 ? "text-yellow-600" : "text-gray-500"}`}>
                          {l.gpm.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-400">goles/PJ</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl p-2.5 text-center bg-green-50"><p className="text-xl font-black text-green-600">{l.goals}</p><p className="text-[10px] text-gray-400">Goles</p></div>
                      <div className="rounded-xl p-2.5 text-center bg-gray-50"><p className="text-xl font-black text-gray-700">{l.matches}</p><p className="text-[10px] text-gray-400">PJ</p></div>
                      <div className="rounded-xl p-2.5 text-center bg-gray-50"><p className="text-xl font-black text-gray-700">{l.yellows}</p><p className="text-[10px] text-gray-400">🟨</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Compartir perfil</p>
              <p className="text-xs text-gray-400 mt-0.5">talachastats.com/player/roberto-mendoza</p>
            </div>
            <button className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl">
              Copiar link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Matchday tab ─────────────────────────────────────────────────────────────

function MatchdayTab() {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex flex-col flex-1">
      <div className="bg-pitch px-5 pt-8 pb-6 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 mb-1">
          <Star size={22} className="text-brand" strokeWidth={2.5} />
          <h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">Tabla de honor</h1>
        </div>
        <p className="text-ink-2 text-sm mt-0.5">Top goleadores · última jornada por liga</p>
      </div>

      <div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-10">
        <div className="max-w-lg mx-auto space-y-4">
          {MATCHDAY.map((league) => (
            <div key={league.league.name} className="bg-surface-2 border border-line rounded-2xl overflow-hidden">
              <div className="h-1 bg-brand" />
              <div className="px-4 pt-4 pb-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-black text-xl uppercase tracking-wide text-ink leading-tight">{league.league.name}</p>
                    <p className="text-xs text-ink-2 capitalize mt-0.5">{league.league.day} · {league.league.season}</p>
                  </div>
                  <div className="bg-surface border border-line rounded-xl px-3 py-1.5 text-center shrink-0">
                    <p className="font-display font-black text-lg text-brand leading-none">J{league.jornada}</p>
                    <p className="text-[9px] text-ink-3 uppercase tracking-wide">jornada</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {league.heroes.map((hero, i) => (
                    <div
                      key={hero.id}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border
                        ${i === 0 ? "bg-pitch border-brand/30" : "bg-surface border-line"}`}
                    >
                      <span className="text-xl shrink-0">{medals[i]}</span>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0
                        ${i === 0 ? "bg-brand text-pitch" : "bg-surface-2 text-ink-2"}`}>
                        {initial(hero.fullName, hero.alias)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink text-sm truncate">{hero.alias ? `"${hero.alias}"` : hero.fullName}</p>
                        <p className="text-xs text-ink-2 truncate">{hero.team}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-display font-black text-2xl leading-none ${i === 0 ? "text-brand" : "text-ink"}`}>{hero.goals}</p>
                        <p className="text-[10px] text-ink-3">{hero.gpm.toFixed(1)}/PJ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Analysis tab ─────────────────────────────────────────────────────────────

function AnalysisTab() {
  const { teamA: a, teamB: b, prob, h2h, prediction: pred, simulator: sim, bullets, funFacts } = ANALYSIS;

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-pitch px-5 pt-8 pb-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={22} className="text-brand" strokeWidth={2.5} />
          <h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">Análisis</h1>
        </div>
        <p className="text-ink-2 text-sm mt-0.5">Pre-partido · Jornada {ANALYSIS.league.jornada}</p>
      </div>

      <div className="bg-surface flex-1 rounded-t-3xl px-4 pt-6 pb-16">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* VS header */}
          <div className="bg-pitch border border-line rounded-2xl p-5 text-center">
            <p className="text-xs text-ink-3 uppercase tracking-widest mb-3">
              {ANALYSIS.league.name} · {ANALYSIS.league.season}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-right flex-1 min-w-0">
                <p className="text-base sm:text-xl font-display font-black text-blue-400 leading-tight">{a.name}</p>
                <p className="text-xs text-ink-3 mt-0.5">{a.position}° en tabla</p>
              </div>
              <div className="font-display font-black text-xl text-ink-3 shrink-0 px-1">VS</div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-base sm:text-xl font-display font-black text-red-400 leading-tight">{b.name}</p>
                <p className="text-xs text-ink-3 mt-0.5">{b.position}° en tabla</p>
              </div>
            </div>
          </div>

          {/* Win probability */}
          <div className="bg-surface-2 border border-line rounded-2xl p-5">
            <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">Probabilidad de victoria</h2>
            <div className="flex rounded-full overflow-hidden h-9 text-xs font-bold">
              <div className="flex items-center justify-center bg-blue-600 text-white" style={{ width: `${prob.a}%` }}>{prob.a}%</div>
              <div className="flex items-center justify-center bg-surface text-ink-3" style={{ width: `${prob.draw}%` }}>{prob.draw}%</div>
              <div className="flex items-center justify-center bg-red-600 text-white" style={{ width: `${prob.b}%` }}>{prob.b}%</div>
            </div>
            <div className="flex justify-between text-xs mt-2 px-0.5">
              <span className="text-blue-400 font-semibold">{a.name}</span>
              <span className="text-ink-3">Empate</span>
              <span className="text-red-400 font-semibold">{b.name}</span>
            </div>
          </div>

          {/* Team cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TeamCard team={a} />
            <TeamCard team={b} />
          </div>

          {/* Prediction */}
          <div className="bg-surface-2 border border-line rounded-2xl p-5 space-y-5">
            <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink">🔮 Predicción</h2>
            <div className="text-center">
              <p className="text-xs text-ink-3 uppercase tracking-widest mb-2">Marcador más probable</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-right">
                  <p className="font-display font-black text-5xl text-blue-400">{pred.scoreA}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{a.name}</p>
                </div>
                <span className="font-display font-black text-3xl text-line">–</span>
                <div className="text-left">
                  <p className="font-display font-black text-5xl text-red-400">{pred.scoreB}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{b.name}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-950 border border-blue-900 rounded-xl p-3">
                <p className="font-display font-black text-3xl text-blue-400">{pred.expA}</p>
                <p className="text-[10px] text-ink-3 mt-0.5">Goles esp.</p>
              </div>
              <div className="bg-pitch border border-line rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                <p className="font-display font-black text-2xl text-ink">{pred.total}</p>
                <p className="text-[10px] text-ink-3">Total</p>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900">Partido abierto</span>
              </div>
              <div className="bg-red-950 border border-red-900 rounded-xl p-3">
                <p className="font-display font-black text-3xl text-red-400">{pred.expB}</p>
                <p className="text-[10px] text-ink-3 mt-0.5">Goles esp.</p>
              </div>
            </div>
          </div>

          {/* Position simulator */}
          <div className="bg-surface-2 border border-line rounded-2xl p-5">
            <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">📈 Simulador de posición</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { name: a.name, s: sim.a, color: "blue" as const },
                { name: b.name, s: sim.b, color: "red" as const },
              ]).map(({ name, s, color }) => (
                <div key={name} className={`rounded-xl border p-4 ${color === "blue" ? "bg-blue-950 border-blue-900" : "bg-red-950 border-red-900"}`}>
                  <p className={`font-display font-black text-lg uppercase mb-1 ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>{name}</p>
                  <p className="text-xs text-ink-3 mb-3">Posición: <strong className="text-ink">{s.pos}°</strong> · {s.pts} pts</p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { label: "Si gana", to: s.win, from: s.pos },
                      { label: "Si empata", to: s.draw, from: s.pos },
                      { label: "Si pierde", to: s.loss, from: s.pos },
                    ].map(({ label, to, from }) => {
                      const delta = from - to;
                      return (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-ink-3">{label}</span>
                          {delta > 0 ? <span className="text-brand font-bold">{to}° ↑{delta}</span>
                            : delta < 0 ? <span className="text-red-400 font-bold">{to}° ↓{Math.abs(delta)}</span>
                              : <span className="text-ink-2 font-bold">{to}° =</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring threats */}
          <div className="bg-surface-2 border border-line rounded-2xl p-5">
            <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">🎯 Amenazas goleadoras</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { team: a, color: "blue" as const },
                { team: b, color: "red" as const },
              ]).map(({ team, color }) => (
                <div key={team.name}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>{team.name}</p>
                  <div className="space-y-2">
                    {team.threats.map((t, i) => (
                      <div key={t.name} className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0
                          ${i === 0 ? (color === "blue" ? "bg-blue-500" : "bg-red-500") : "bg-surface border border-line text-ink-3"}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{t.name}</p>
                          <p className="text-xs text-ink-3">{t.goals} goles · {t.gpm} x partido</p>
                        </div>
                        <DangerBadge rating={t.danger} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Narrator */}
          <section className="bg-surface-2 border border-line rounded-2xl p-5">
            <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">🎙️ Guión del narrador</h2>
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="text-sm text-ink-2 bg-pitch border border-line rounded-xl px-4 py-2.5">{b}</li>
              ))}
            </ul>
          </section>

          {/* Fun facts */}
          <section className="bg-surface-2 border border-line rounded-2xl p-5">
            <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">💡 Datos curiosos</h2>
            <ul className="space-y-2">
              {funFacts.map((f, i) => (
                <li key={i} className="text-sm text-ink-2 flex gap-2">
                  <span className="text-brand shrink-0">★</span>{f}
                </li>
              ))}
            </ul>
          </section>

          {/* H2H */}
          <div className="bg-surface-2 border border-line rounded-2xl p-5">
            <h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">📋 Cara a cara</h2>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center flex-1">
                <p className="font-display font-black text-5xl text-blue-400">{h2h.aWins}</p>
                <p className="text-xs text-ink-3 mt-1">{a.name}</p>
              </div>
              <div className="text-center">
                <p className="font-display font-black text-4xl text-ink-3">{h2h.draws}</p>
                <p className="text-xs text-ink-3">Empates</p>
              </div>
              <div className="text-center flex-1">
                <p className="font-display font-black text-5xl text-red-400">{h2h.bWins}</p>
                <p className="text-xs text-ink-3 mt-1">{b.name}</p>
              </div>
            </div>
            <p className="text-center text-xs text-ink-3 mt-4 border-t border-line pt-3">
              Último: <strong className="text-ink">{h2h.last.a}–{h2h.last.b}</strong> · Azteca ganó
            </p>
          </div>

          {/* Rosters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RosterTable team={a} color="blue" />
            <RosterTable team={b} color="red" />
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type TeamData = typeof ANALYSIS.teamA;

function TeamCard({ team }: { team: TeamData }) {
  const isBlue = team.color === "blue";
  const accent = isBlue ? "text-blue-400" : "text-red-400";
  const topBorder = isBlue ? "border-t-blue-500" : "border-t-red-500";
  const statBg = isBlue ? "bg-blue-950 border-blue-900" : "bg-red-950 border-red-900";
  const statVal = isBlue ? "text-blue-300" : "text-red-300";

  const resultColor = (r: "W" | "D" | "L") =>
    r === "W" ? "bg-green-600" : r === "D" ? "bg-surface border border-line text-ink-2" : "bg-red-600";

  return (
    <div className={`bg-surface-2 border border-line border-t-2 ${topBorder} rounded-2xl p-5`}>
      <h3 className={`font-display font-black text-2xl ${accent} mb-3 uppercase tracking-wide`}>{team.name}</h3>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: "PTS", value: team.points },
          { label: "G", value: team.record.w },
          { label: "E", value: team.record.d },
          { label: "P", value: team.record.l },
        ].map(s => (
          <div key={s.label} className={`${statBg} border rounded-lg p-2 text-center`}>
            <p className={`text-xl font-display font-black ${statVal}`}>{s.value}</p>
            <p className="text-[10px] text-ink-3 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-3 text-sm flex-wrap">
        <span className="text-ink-3">GF <strong className="text-ink">{team.gf}</strong></span>
        <span className="text-line">|</span>
        <span className="text-ink-3">GC <strong className="text-ink">{team.gc}</strong></span>
        <span className="text-line">|</span>
        <span className="text-ink-3">Dif <strong className={team.diff >= 0 ? "text-brand" : "text-red-400"}>+{team.diff}</strong></span>
        <span className="text-line">|</span>
        <span className="text-ink-3">Prom <strong className="text-ink">{team.avg}</strong></span>
      </div>

      <div className="flex gap-1 mb-3">
        <span className="text-xs text-ink-3 mr-1 self-center">Últ. 5:</span>
        {team.last5.map((r, i) => (
          <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${resultColor(r)}`}>
            {r === "W" ? "G" : r === "D" ? "E" : "P"}
          </span>
        ))}
      </div>

      <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3 bg-green-950 text-green-400 border border-green-900">
        🔥 Racha: {team.streak.count} {team.streak.type === "W" ? "victorias" : "empates"}
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border
          ${team.attackRank <= 2 ? "bg-green-950 text-green-400 border-green-900" : "bg-yellow-950 text-yellow-400 border-yellow-900"}`}>
          ⚔️ {team.attackRank <= 2 ? "Ataque fuerte" : "Ataque regular"} ({team.attackRank}/{team.totalTeams})
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border
          ${team.defenseRank <= 2 ? "bg-green-950 text-green-400 border-green-900" : "bg-yellow-950 text-yellow-400 border-yellow-900"}`}>
          🛡️ {team.defenseRank <= 2 ? "Defensa sólida" : "Defensa regular"} ({team.defenseRank}/{team.totalTeams})
        </span>
      </div>

      <div className="space-y-1.5 border-t border-line pt-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brand">⚽</span>
          <span className="text-ink-2">{team.topScorer.name}</span>
          <span className="ml-auto text-ink-3">{team.topScorer.goals} goles</span>
        </div>
        {team.cardRisk.map(r => (
          <div key={r.player} className="flex items-center gap-2 text-sm">
            <span>🟨</span>
            <span className="text-ink-2">{r.player}</span>
            <span className="ml-auto text-xs text-yellow-400">{r.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RosterTable({ team, color }: { team: TeamData; color: "blue" | "red" }) {
  const accent = color === "blue" ? "text-blue-400 border-t-blue-500" : "text-red-400 border-t-red-500";
  return (
    <div className={`bg-surface-2 border border-line border-t-2 ${accent} rounded-2xl overflow-hidden`}>
      <div className="px-4 py-3 border-b border-line">
        <h3 className={`font-display font-black text-lg uppercase tracking-wide ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>{team.name}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-pitch text-ink-3 uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-semibold tracking-wide">Jugador</th>
              <th className="px-2 py-2 text-center">⚽</th>
              <th className="px-2 py-2 text-center">🟨</th>
              <th className="px-2 py-2 text-center">🟥</th>
              <th className="px-2 py-2 text-center">PJ</th>
              <th className="px-2 py-2 text-center">Peligro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {team.roster.map(p => (
              <tr key={p.name} className={`hover:bg-pitch transition ${p.goals === 0 ? "opacity-40" : ""}`}>
                <td className="px-3 py-2 font-medium text-ink max-w-[130px] truncate">{p.name}</td>
                <td className="px-2 py-2 text-center font-bold text-brand">{p.goals || "—"}</td>
                <td className="px-2 py-2 text-center text-yellow-400">{p.yellows || "—"}</td>
                <td className="px-2 py-2 text-center text-red-400">{p.reds || "—"}</td>
                <td className="px-2 py-2 text-center text-ink-3">{p.pj}</td>
                <td className="px-2 py-2 text-center"><DangerBadge rating={p.danger} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DangerBadge({ rating }: { rating: string }) {
  const styles: Record<string, string> = {
    ALTO: "bg-red-950 text-red-400 border-red-900",
    MEDIO: "bg-yellow-950 text-yellow-400 border-yellow-900",
    BAJO: "bg-surface text-ink-3 border-line",
  };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${styles[rating] ?? styles.BAJO}`}>{rating}</span>;
}

// ─── CTA Footer ───────────────────────────────────────────────────────────────

function CtaFooter() {
  return (
    <div className="bg-pitch border-t border-line px-5 py-12">
      <div className="max-w-lg mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest">
          Para coordinadores de liga
        </div>
        <h2 className="font-display font-black text-4xl uppercase tracking-tight text-ink leading-tight">
          ¿Quieres esto<br />para <span className="text-brand">tu liga</span>?
        </h2>
        <p className="text-ink-2 text-sm leading-relaxed max-w-sm mx-auto">
          Ranking público, perfiles compartibles, análisis pre-partido para el narrador del Facebook Live.
          Setup en menos de una semana.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href="https://wa.me/526647738664?text=Hola,%20quiero%20TalachaStats%20para%20mi%20liga"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-8 py-4 rounded-xl text-base transition"
          >
            WhatsApp
            <ChevronRight size={16} strokeWidth={2.5} />
          </a>
          <a
            href="mailto:adalbertojocobi@gmail.com?subject=TalachaStats%20-%20mi%20liga"
            className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-line border border-line text-ink font-bold px-8 py-4 rounded-xl text-base transition"
          >
            Enviar correo
          </a>
        </div>
      </div>
    </div>
  );
}
