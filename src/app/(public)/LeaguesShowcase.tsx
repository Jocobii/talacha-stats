"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight, Users, Star } from "lucide-react";
import { titleCase } from "@/shared/lib/normalize";
import type { LeagueShowcaseItem } from "@/entities/organization";

/* ── Card individual ─────────────────────────────────────────────────────────── */
function LeagueCardItem({ league, delay, visible }: {
  league: LeagueShowcaseItem; delay: number; visible: boolean;
}) {
  const initial = league.name.charAt(0).toUpperCase();

  return (
    <div
      className="bg-surface border border-line rounded-2xl overflow-hidden hover:border-brand/40 transition-colors group"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, border-color 0.2s`,
      }}
    >
      {/* Header de la liga */}
      <div className="bg-brand/5 border-b border-line px-4 py-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center shrink-0">
          <span className="font-display font-black text-lg text-brand">{initial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-black text-base text-ink uppercase tracking-tight leading-tight truncate">
            {league.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} strokeWidth={2} className="text-ink-3 shrink-0" />
            <p className="text-[11px] text-ink-3 truncate">
              {league.city}{league.season ? ` · ${league.season}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats de la liga */}
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
        <div className="flex flex-col items-center py-3 gap-0.5">
          <div className="flex items-center gap-1">
            <Users size={10} strokeWidth={2} className="text-ink-3" />
            <span className="font-display font-black text-2xl text-ink leading-none">
              {league.playerCount}
            </span>
          </div>
          <span className="text-[10px] text-ink-3 uppercase tracking-widest font-semibold">
            Jugadores
          </span>
        </div>
        <div className="flex flex-col items-center py-3 gap-0.5">
          <span className="font-display font-black text-2xl text-ink leading-none">
            {league.teamCount}
          </span>
          <span className="text-[10px] text-ink-3 uppercase tracking-widest font-semibold">
            Equipos
          </span>
        </div>
      </div>

      {/* Goleador top */}
      <div className="px-4 py-3 flex items-center gap-2.5">
        <Star size={12} strokeWidth={2} className="text-brand shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ink-3 uppercase tracking-widest font-semibold mb-0.5">
            Goleador
          </p>
          {league.topScorer ? (
            <p className="text-sm font-semibold text-ink truncate">
              {league.topScorer.alias
                ? <>&quot;{titleCase(league.topScorer.alias)}&quot;</>
                : titleCase(league.topScorer.fullName)}
            </p>
          ) : (
            <p className="text-sm text-ink-3 italic truncate">Sin datos aún</p>
          )}
        </div>
        {league.topScorer && (
          <div className="text-right shrink-0">
            <p className="font-display font-black text-xl text-brand leading-none">
              {league.topScorer.goals}
            </p>
            <p className="text-[10px] text-ink-3">goles</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-3.5">
        <Link
          href={`/ranking?scope=league`}
          className="flex items-center justify-center gap-1 w-full text-xs font-semibold text-ink-3 group-hover:text-brand border border-line group-hover:border-brand/30 py-2 rounded-xl transition"
        >
          Ver liga
          <ChevronRight size={12} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

/* ── Sección completa ─────────────────────────────────────────────────────────── */
export default function LeaguesShowcase({ leagues }: { leagues: LeagueShowcaseItem[] }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (leagues.length === 0) return null;

  return (
    <section className="bg-pitch border-t border-line px-5 py-16">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
          style={{
            opacity:    visible ? 1 : 0,
            transform:  visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div>
            <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1.5">
              Ligas en la plataforma
            </p>
            <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-ink leading-tight">
              Tu liga,<br className="sm:hidden" /> en el mapa.
            </h2>
            <p className="text-ink-2 text-sm mt-2 max-w-sm">
              Estas ligas ya tienen presencia pública. Sus jugadores, sus goleadores y su historia, visibles para toda la ciudad.
            </p>
          </div>
          <Link
            href="/about#organizadores"
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand border border-brand/30 hover:bg-brand/8 px-4 py-2.5 rounded-xl transition"
          >
            Registra la tuya
            <ChevronRight size={14} strokeWidth={2} />
          </Link>
        </div>

        {/* Grid de ligas */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map((league, i) => (
            <LeagueCardItem
              key={league.id}
              league={league}
              delay={i * 100}
              visible={visible}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
