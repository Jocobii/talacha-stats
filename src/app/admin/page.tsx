import Link from "next/link";

async function getDashboardData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const [leaguesRes, playersRes] = await Promise.all([
    fetch(`${base}/api/leagues`, { cache: "no-store" }),
    fetch(`${base}/api/players`, { cache: "no-store" }),
  ]);
  const leagues = leaguesRes.ok ? (await leaguesRes.json()).data ?? [] : [];
  const players = playersRes.ok ? (await playersRes.json()).data ?? [] : [];
  return { leagues, players };
}

export default async function AdminDashboard() {
  const { leagues, players } = await getDashboardData();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Ligas activas" value={leagues.length} color="bg-green-100 text-green-800" />
        <StatCard label="Jugadores registrados" value={players.length} color="bg-blue-100 text-blue-800" />
        <StatCard label="Temporadas" value={[...new Set(leagues.map((l: { season: string }) => l.season))].length} color="bg-yellow-100 text-yellow-800" />
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Ligas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {leagues.map((league: { id: string; name: string; dayOfWeek: string; season: string; teams: unknown[] }) => (
          <Link
            key={league.id}
            href={`/admin/leagues/${league.id}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition border border-gray-100"
          >
            <p className="font-semibold text-gray-800">{league.name}</p>
            <p className="text-sm text-gray-500 capitalize">{league.dayOfWeek} — {league.season}</p>
            <p className="text-xs text-gray-400 mt-1">{league.teams?.length ?? 0} equipos</p>
          </Link>
        ))}
        <Link
          href="/admin/leagues"
          className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 flex items-center justify-center text-green-700 hover:bg-green-100 transition"
        >
          + Nueva liga
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}
