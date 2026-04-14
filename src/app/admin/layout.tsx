import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link href="/admin" className="font-bold text-lg tracking-tight">
            ⚽ FutbolStats
          </Link>
          <Link href="/admin/leagues" className="hover:underline text-sm">Ligas</Link>
          <Link href="/admin/players" className="hover:underline text-sm">Jugadores</Link>
          <Link href="/admin/import" className="hover:underline text-sm">Importar Excel</Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
