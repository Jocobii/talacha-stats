import Link from "next/link";
import { notFound } from "next/navigation";

async function getPlayerStats(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/players/${id}/stats`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()).data;
}

export default async function PlayerStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPlayerStats(id);
  if (!data) notFound();

  const { player, byLeague, global: g } = data;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/players" className="text-sm text-gray-500 hover:underline">
          ← Jugadores
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">{player.fullName}</h1>
        {player.alias && <p className="text-gray-500">"{player.alias}"</p>}
      </div>

      {/* Stats globales */}
      <div className="bg-green-700 text-white rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Estadísticas globales</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
          <Stat label="Partidos" value={g.totalMatches} />
          <Stat label="Goles" value={g.totalGoals} />
          <Stat label="Asistencias" value={g.totalAssists} />
          <Stat label="Amarillas" value={g.totalYellowCards} />
          <Stat label="Rojas" value={g.totalRedCards} />
          <Stat label="Ligas" value={g.leaguesCount} />
        </div>
      </div>

      {/* Stats por liga */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Por liga</h2>
      {byLeague.length === 0 ? (
        <p className="text-gray-500">Sin partidos registrados.</p>
      ) : (
        <div className="space-y-4">
          {byLeague.map((s: {
            leagueId: string;
            leagueName: string;
            season: string;
            teamName: string;
            matchesPlayed: number;
            goals: number;
            assists: number;
            yellowCards: number;
            redCards: number;
          }) => (
            <div key={s.leagueId} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{s.leagueName}</p>
                  <p className="text-xs text-gray-500">{s.season} — {s.teamName}</p>
                </div>
                <Link
                  href={`/admin/leagues/${s.leagueId}`}
                  className="text-xs text-green-600 hover:underline"
                >
                  Ver liga →
                </Link>
              </div>
              <div className="grid grid-cols-5 gap-3 text-center">
                <Stat label="Partidos" value={s.matchesPlayed} dark />
                <Stat label="Goles" value={s.goals} dark />
                <Stat label="Asist." value={s.assists} dark />
                <Stat label="Amarillas" value={s.yellowCards} dark />
                <Stat label="Rojas" value={s.redCards} dark />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, dark }: { label: string; value: number; dark?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${dark ? "text-gray-800" : "text-white"}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-green-100"}`}>{label}</p>
    </div>
  );
}
