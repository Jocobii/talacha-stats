import Link from "next/link";
import { getActiveCity } from "@/shared/lib/active-city";

async function getLeagues(city: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res  = await fetch(`${base}/api/leagues?city=${encodeURIComponent(city)}`, { cache: "no-store" });
  return res.ok ? (await res.json()).data ?? [] : [];
}

const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
  jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};

export default async function LeaguesPage() {
  const city    = await getActiveCity();
  const leagues = await getLeagues(city);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ligas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{city}</p>
        </div>
        <Link
          href="/admin/leagues/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          + Nueva liga
        </Link>
      </div>

      {leagues.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-4xl mb-4">⚽</p>
          <p className="text-gray-600 font-medium mb-1">No hay ligas en {city}</p>
          <p className="text-gray-400 text-sm mb-6">Crea la primera liga para esta ciudad</p>
          <Link
            href="/admin/leagues/new"
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Crear liga
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map((league: {
            id: string;
            name: string;
            dayOfWeek: string;
            season: string;
            teams: unknown[];
          }) => (
            <Link
              key={league.id}
              href={`/admin/leagues/${league.id}`}
              className="bg-white rounded-xl shadow p-5 hover:shadow-md transition border border-gray-100 block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{league.name}</p>
                  <p className="text-sm text-gray-500">{DAY_LABELS[league.dayOfWeek] ?? league.dayOfWeek} · {league.season}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {league.teams?.length ?? 0} equipos
                </span>
              </div>
              <p className="text-xs text-green-600 font-medium">Ver liga →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
