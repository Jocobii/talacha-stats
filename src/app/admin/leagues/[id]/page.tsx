import Link from "next/link";
import { notFound } from "next/navigation";

async function getLeagueData(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const [leagueRes, standingsRes, scorersRes] = await Promise.all([
    fetch(`${base}/api/leagues/${id}`, { cache: "no-store" }),
    fetch(`${base}/api/leagues/${id}/standings`, { cache: "no-store" }),
    fetch(`${base}/api/leagues/${id}/top-scorers?limit=5`, { cache: "no-store" }),
  ]);

  if (!leagueRes.ok) return null;
  return {
    league: (await leagueRes.json()).data,
    standings: standingsRes.ok ? (await standingsRes.json()).data?.standings ?? [] : [],
    topScorers: scorersRes.ok ? (await scorersRes.json()).data ?? [] : [],
  };
}

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getLeagueData(id);
  if (!data) notFound();

  const { league, standings, topScorers } = data;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">{league.name}</h1>
        <p className="text-gray-500 capitalize">{league.dayOfWeek} — {league.season}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de posiciones */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Tabla de posiciones</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Equipo</th>
                  <th className="px-3 py-2 text-center">PJ</th>
                  <th className="px-3 py-2 text-center">G</th>
                  <th className="px-3 py-2 text-center">E</th>
                  <th className="px-3 py-2 text-center">P</th>
                  <th className="px-3 py-2 text-center">GF</th>
                  <th className="px-3 py-2 text-center">GC</th>
                  <th className="px-3 py-2 text-center">DG</th>
                  <th className="px-3 py-2 text-center font-bold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standings.map((s: {
                  teamId: string;
                  teamName: string;
                  played: number;
                  wins: number;
                  draws: number;
                  losses: number;
                  goalsFor: number;
                  goalsAgainst: number;
                  goalDifference: number;
                  points: number;
                }, i: number) => (
                  <tr key={s.teamId} className={i === 0 ? "bg-green-50" : "hover:bg-gray-50"}>
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{s.teamName}</td>
                    <td className="px-3 py-2 text-center">{s.played}</td>
                    <td className="px-3 py-2 text-center text-green-600">{s.wins}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{s.draws}</td>
                    <td className="px-3 py-2 text-center text-red-500">{s.losses}</td>
                    <td className="px-3 py-2 text-center">{s.goalsFor}</td>
                    <td className="px-3 py-2 text-center">{s.goalsAgainst}</td>
                    <td className="px-3 py-2 text-center">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                    <td className="px-3 py-2 text-center font-bold text-gray-800">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top goleadores + partidos recientes */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Top goleadores</h2>
            <div className="bg-white rounded-lg shadow p-4 space-y-2">
              {topScorers.map((s: { playerId: string; fullName: string; alias: string | null; teamName: string; goals: number }, i: number) => (
                <div key={s.playerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <div>
                      <Link href={`/admin/players/${s.playerId}`} className="text-sm font-medium text-gray-800 hover:underline">
                        {s.alias ?? s.fullName}
                      </Link>
                      <p className="text-xs text-gray-400">{s.teamName}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">{s.goals} ⚽</span>
                </div>
              ))}
              {topScorers.length === 0 && <p className="text-sm text-gray-400">Sin datos.</p>}
            </div>
          </div>

          {/* Partidos recientes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-700">Partidos</h2>
              <Link href="#" className="text-sm text-green-600 hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2">
              {league.matches?.slice(0, 5).map((m: {
                id: string;
                matchday: number | null;
                matchDate: string;
                homeTeam: { name: string };
                awayTeam: { name: string };
                homeScore: number;
                awayScore: number;
                status: string;
              }) => (
                <Link
                  key={m.id}
                  href={`/admin/matches/${m.id}`}
                  className="block bg-white rounded-lg shadow p-3 hover:shadow-md transition"
                >
                  <p className="text-xs text-gray-400 mb-1">
                    J{m.matchday ?? "?"} · {m.matchDate}
                    {m.status === "scheduled" && <span className="ml-2 bg-yellow-100 text-yellow-700 px-1 rounded text-xs">Pendiente</span>}
                  </p>
                  <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                    <span className="flex-1">{m.homeTeam.name}</span>
                    <span className="px-3 font-bold">
                      {m.status === "completed" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                    </span>
                    <span className="flex-1 text-right">{m.awayTeam.name}</span>
                  </div>
                </Link>
              ))}
              {(league.matches?.length === 0) && (
                <p className="text-sm text-gray-400">Sin partidos.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
