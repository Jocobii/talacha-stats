import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TalachaStats — Tu historial de goles en todas las ligas",
  description:
    "Estadísticas cross-liga para jugadores amateurs de fútbol 7 en Tijuana. Todos tus goles, todas tus ligas, un solo perfil.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Nav mínima ─────────────────────────────────────────────────────── */}
      <header className="px-5 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <span className="text-white font-black text-lg">⚽ TalachaStats</span>
        <Link
          href="/login"
          className="text-gray-400 hover:text-white text-sm transition"
        >
          Admin →
        </Link>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16 text-center">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Badge */}
          <span className="inline-block text-xs font-semibold bg-green-900 text-green-400 px-3 py-1 rounded-full uppercase tracking-widest">
            Tijuana · Fútbol Amateur
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Tus goles hablan<br />
            <span className="text-green-400">por ti.</span>
          </h1>

          {/* Descripción */}
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            Juegas en Novofut, Casa Blanca, Furati o cualquier liga local.
            TalachaStats reúne tus estadísticas de <strong className="text-gray-200">todas tus ligas</strong> en
            un solo perfil que puedes compartir <strong className="text-gray-200">cuando alguien te pregunte si juegas bien.</strong>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/jugadores"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition"
            >
              🔍 Buscar jugadores
            </Link>
            <Link
              href="/analisis"
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition"
            >
              📊 Análisis de partido
            </Link>
          </div>
        </div>
      </main>

      {/* ── Features rápidas ───────────────────────────────────────────────── */}
      <section className="bg-gray-900 px-5 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            {
              icon: "⚽",
              title: "Goles por partido",
              desc: "La métrica que importa. Normaliza tus números sin importar cuántas jornadas lleva cada liga.",
            },
            {
              icon: "🏆",
              title: "Todas tus ligas",
              desc: "¿Juegas en 4 ligas distintas? Tu perfil las agrega todas en un solo lugar.",
            },
            {
              icon: "📲",
              title: "Comparte tu perfil",
              desc: "Un link. Lo mandas por WhatsApp y quien lo abre ve tus números reales.",
            },
          ].map((f) => (
            <div key={f.title} className="space-y-2">
              <p className="text-3xl">{f.icon}</p>
              <p className="text-white font-bold text-sm">{f.title}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 px-5 py-6 text-center">
        <p className="text-gray-600 text-xs">⚽ TalachaStats · Tijuana</p>
      </footer>
    </div>
  );
}
