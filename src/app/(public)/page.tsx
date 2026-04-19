import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, Search, Star, BarChart3, MapPin, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "TalachaStats — Tu historial de goles en todas las ligas",
  description:
    "Estadísticas cross-liga para jugadores amateurs de fútbol 7 en Tijuana. Todos tus goles, todas tus ligas, un solo perfil.",
};

export default function HomePage() {
  return (
    <div className="text-ink flex flex-col flex-1">

      {/* Nav */}
      <header className="px-5 py-4 flex items-center justify-between max-w-4xl mx-auto w-full border-b border-line">
        <span className="font-display font-black text-xl uppercase tracking-widest text-ink">
          TalachaStats
        </span>
        <Link href="/login" className="text-ink-3 hover:text-ink text-sm transition">
          Admin →
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-20 text-center">
        <div className="max-w-xl mx-auto space-y-7">

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest">
            <MapPin size={11} strokeWidth={2.5} /> Tijuana · Fútbol Amateur
          </span>

          <h1 className="font-display font-black text-6xl sm:text-8xl uppercase leading-[0.9] tracking-tight">
            Tus goles<br />
            <span className="text-brand">hablan</span><br />
            por ti.
          </h1>

          <p className="text-ink-2 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            Juegas en las ligas más populares de Tijuana.
            TalachaStats reúne tus estadísticas de{" "}
            <strong className="text-ink font-semibold">todas tus ligas</strong>{" "}
            en un solo perfil que puedes compartir cuando alguien te pregunte si juegas bien.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/ranking"
              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-8 py-4 rounded-xl text-base transition font-body"
            >
              <Trophy size={18} strokeWidth={2.5} />
              Ver ranking
            </Link>
            <Link
              href="/players"
              className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-line border border-line text-ink font-bold px-8 py-4 rounded-xl text-base transition"
            >
              <Search size={18} strokeWidth={2.5} />
              Buscar jugadores
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/matchday"
              className="flex items-center justify-center gap-2 bg-surface border border-line text-ink-2 hover:text-ink font-semibold px-6 py-3 rounded-xl text-sm transition"
            >
              <Star size={15} strokeWidth={2} />
              Tabla de honor
            </Link>
            <Link
              href="/analysis"
              className="flex items-center justify-center gap-2 bg-surface border border-line text-ink-2 hover:text-ink font-semibold px-6 py-3 rounded-xl text-sm transition"
            >
              <BarChart3 size={15} strokeWidth={2} />
              Análisis de partido
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="bg-surface border-t border-line px-5 py-14">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            {
              Icon: Trophy,
              title: "Ranking de Tijuana",
              desc: "¿Cuántos están por encima de ti? El ranking cruza todas las ligas para darte tu posición real en la ciudad.",
            },
            {
              Icon: Star,
              title: "Tabla de honor",
              desc: "Los mejores de cada jornada, por liga. El reconocimiento que se gana con goles.",
            },
            {
              Icon: Search,
              title: "Perfil compartible",
              desc: "Tu link personal. Lo mandas por WhatsApp y quien lo abre ve tus goles en todas las ligas.",
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center space-y-3 sm:items-start sm:text-left">
              <div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center shrink-0">
                <Icon size={20} className="text-brand" strokeWidth={2} />
              </div>
              <p className="font-bold text-ink text-sm">{title}</p>
              <p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
