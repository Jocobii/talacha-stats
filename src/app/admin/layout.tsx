import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-1">
          <Link href="/admin" className="font-bold text-base tracking-tight shrink-0 mr-2">
            TalachaStats
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0">
            <Link href="/admin/leagues" className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition">Ligas</Link>
            <Link href="/admin/teams" className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition">Equipos</Link>
            <Link href="/admin/players" className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition">Jugadores</Link>
            <Link href="/admin/import" className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition">Importar</Link>
            <Link href="/admin/analisis" className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg shrink-0 transition">📊 Análisis</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {children}
      </main>
    </div>
  );
}
