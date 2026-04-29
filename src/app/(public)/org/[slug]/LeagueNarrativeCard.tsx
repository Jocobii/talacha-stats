import Link from "next/link";
import { ChevronRight, Trophy, Crosshair } from "lucide-react";
import { titleCase } from "@/shared/lib/normalize";
import type { LeagueSnapshot } from "@/entities/organization";

const DAY_ABBR: Record<string, string> = {
  lunes: "LUN", martes: "MAR", miercoles: "MIÉ",
  jueves: "JUE", viernes: "VIE", sabado: "SÁB", domingo: "DOM",
};

type Props = {
  league: {
    name: string;
    slug: string | null;
    season: string;
    dayOfWeek: string;
    teams: unknown[];
  };
  snapshot: LeagueSnapshot;
  narrative: string;
  orgSlug: string;
};

/**
 * Tarjeta narrativa — Idea D.
 * Muestra el copy generado por buildNarrativeLine() + stats de soporte + CTA.
 * No tiene estado: recibe todo como props desde el Server Component padre.
 */
export default function LeagueNarrativeCard({ league, snapshot, narrative, orgSlug }: Props) {
  const abbr = DAY_ABBR[league.dayOfWeek.toLowerCase()] ?? league.dayOfWeek.slice(0, 3).toUpperCase();
  // Si la liga no tiene slug, va a la página de la org (mejor que un "#" inútil)
  const href = league.slug
    ? `/org/${orgSlug}/${league.slug}`
    : `/org/${orgSlug}`;

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">

      {/* Header de liga */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-line">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <span className="font-display font-black text-xs text-brand">{abbr}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink truncate">{titleCase(league.name)}</p>
          <p className="text-xs text-ink-3">
            {league.season} · {league.teams.length} equipo{league.teams.length !== 1 ? "s" : ""}
          </p>
        </div>
        {snapshot.lastJornada && (
          <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 rounded-lg px-2 py-0.5 shrink-0">
            J{snapshot.lastJornada}
          </span>
        )}
      </div>

      {/* Narrativa (Idea D) */}
      <p className="px-4 py-3 text-sm text-ink-2 leading-relaxed italic border-b border-line">
        {narrative}
      </p>

      {/* Stats de soporte */}
      {(snapshot.leader || snapshot.topScorer) && (
        <div className="px-4 py-3 space-y-1.5 border-b border-line">
          {snapshot.leader && (
            <div className="flex items-center gap-2">
              <Trophy size={12} strokeWidth={2} className="text-brand shrink-0" />
              <span className="text-xs font-semibold text-ink flex-1 truncate">
                {titleCase(snapshot.leader.teamName)}
              </span>
              <span className="text-xs font-black text-brand shrink-0">
                {snapshot.leader.points} pts
              </span>
            </div>
          )}
          {snapshot.topScorer && (
            <div className="flex items-center gap-2">
              <Crosshair size={12} strokeWidth={2} className="text-ink-3 shrink-0" />
              <span className="text-xs text-ink-2 flex-1 truncate">
                {snapshot.topScorer.alias
                  ? `"${titleCase(snapshot.topScorer.alias)}"`
                  : titleCase(snapshot.topScorer.fullName)}
              </span>
              <span className="text-xs font-bold text-ink-2 shrink-0">
                {snapshot.topScorer.goals} goles
              </span>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <Link
        href={href}
        className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-ink-3 hover:text-brand group transition-colors"
      >
        <span>Ver tabla y goleadores completos</span>
        <ChevronRight size={14} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
