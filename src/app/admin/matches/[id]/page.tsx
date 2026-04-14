import Link from "next/link";
import { notFound } from "next/navigation";

async function getMatchData(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/matches/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()).data;
}

const EVENT_LABELS: Record<string, string> = {
  goal: "⚽ Gol",
  assist: "🎯 Asistencia",
  yellow_card: "🟨 Amarilla",
  red_card: "🟥 Roja",
  own_goal: "😬 Autogol",
  mvp: "⭐ MVP",
};

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchData(id);
  if (!match) notFound();

  const homeEvents = match.events.filter((e: { team: { id: string } }) => e.team.id === match.homeTeam.id);
  const awayEvents = match.events.filter((e: { team: { id: string } }) => e.team.id === match.awayTeam.id);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/leagues/${match.league.id}`} className="text-sm text-gray-500 hover:underline">
          ← {match.league.name}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-bold text-gray-800">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/matches/${id}/preview`}
              className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-600"
            >
              📋 Vista Narrador
            </Link>
          </div>
        </div>
        <p className="text-gray-500 text-sm">J{match.matchday ?? "?"} · {match.matchDate}</p>
      </div>

      {/* Marcador */}
      <div className="bg-green-700 text-white rounded-xl p-6 text-center mb-6">
        <div className="flex items-center justify-center gap-8">
          <div className="flex-1 text-right">
            <p className="font-bold text-lg">{match.homeTeam.name}</p>
            <p className="text-4xl font-black mt-1">{match.homeScore}</p>
          </div>
          <div className="text-2xl font-light opacity-50">—</div>
          <div className="flex-1 text-left">
            <p className="font-bold text-lg">{match.awayTeam.name}</p>
            <p className="text-4xl font-black mt-1">{match.awayScore}</p>
          </div>
        </div>
        <p className="text-green-200 text-sm mt-3 capitalize">{match.status}</p>
      </div>

      {/* Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EventList
          title={match.homeTeam.name}
          events={homeEvents}
        />
        <EventList
          title={match.awayTeam.name}
          events={awayEvents}
        />
      </div>

      <div className="mt-6">
        <Link
          href={`/admin/matches/${id}/preview`}
          className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg hover:bg-yellow-100 transition"
        >
          <span className="text-lg">📋</span>
          <div>
            <p className="font-semibold text-sm">Abrir vista narrador</p>
            <p className="text-xs opacity-70">Estadísticas pre-partido para el live de Facebook</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function EventList({ title, events }: {
  title: string;
  events: { id: string; eventType: string; minute: number | null; player: { fullName: string; alias: string | null } }[]
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
      {events.length === 0 ? (
        <p className="text-sm text-gray-400">Sin eventos.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-sm">
              <span>{EVENT_LABELS[e.eventType] ?? e.eventType}</span>
              <span className="font-medium text-gray-800">{e.player.alias ?? e.player.fullName}</span>
              {e.minute && <span className="text-gray-400 text-xs">{e.minute}'</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
