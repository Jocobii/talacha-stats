import Link from "next/link";
import { notFound } from "next/navigation";
import type { MatchPreview, TopThreat, CardRiskPlayer, TeamFormStats } from "@/types";

async function getPreview(id: string): Promise<MatchPreview | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/matches/${id}/preview`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()).data;
}

export default async function MatchPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const preview = await getPreview(id);
  if (!preview) notFound();

  const { match, teamForm, winProbability, topThreats, cardRisk, headToHead, narratorBullets } = preview;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/admin/matches/${id}`} className="text-sm text-gray-500 hover:underline">
            ← Volver al partido
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Vista Narrador</h1>
          <p className="text-gray-500 text-sm">
            {match.homeTeam} vs {match.awayTeam} · J{match.matchday ?? "?"} · {match.date}
          </p>
        </div>
        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
          PRE-PARTIDO
        </span>
      </div>

      {/* Bullets para el narrador */}
      <div className="bg-gray-900 text-green-300 rounded-xl p-5 mb-6 font-mono text-sm">
        <p className="text-green-500 text-xs uppercase tracking-widest mb-3">📢 Frases para el narrador</p>
        <ul className="space-y-2">
          {narratorBullets.map((bullet, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500">›</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Probabilidades */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Probabilidad de victoria</h2>
        <div className="flex items-center gap-4">
          <div className="text-center w-28">
            <p className="text-3xl font-black text-green-600">{winProbability.homeWinPct}%</p>
            <p className="text-xs text-gray-500 mt-1 truncate">{match.homeTeam}</p>
          </div>
          <div className="flex-1">
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${winProbability.homeWinPct}%` }}
              />
              <div
                className="bg-gray-300"
                style={{ width: `${winProbability.drawPct}%` }}
              />
              <div
                className="bg-blue-400"
                style={{ width: `${winProbability.awayWinPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Local</span>
              <span>Empate {winProbability.drawPct}%</span>
              <span>Visitante</span>
            </div>
          </div>
          <div className="text-center w-28">
            <p className="text-3xl font-black text-blue-500">{winProbability.awayWinPct}%</p>
            <p className="text-xs text-gray-500 mt-1 truncate">{match.awayTeam}</p>
          </div>
        </div>
      </div>

      {/* Forma de ambos equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TeamFormCard title={match.homeTeam} form={teamForm.home} color="green" />
        <TeamFormCard title={match.awayTeam} form={teamForm.away} color="blue" />
      </div>

      {/* Amenazas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ThreatsCard title={`Amenazas — ${match.homeTeam}`} threats={topThreats.home} />
        <ThreatsCard title={`Amenazas — ${match.awayTeam}`} threats={topThreats.away} />
      </div>

      {/* Riesgo tarjetas + H2H */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CardRiskCard
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeRisk={cardRisk.home}
          awayRisk={cardRisk.away}
        />
        <H2HCard
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          h2h={headToHead}
        />
      </div>
    </div>
  );
}

function TeamFormCard({ title, form, color }: { title: string; form: TeamFormStats; color: "green" | "blue" }) {
  const accent = color === "green" ? "text-green-600" : "text-blue-600";
  const resultColor = (r: "W" | "D" | "L") =>
    r === "W" ? "bg-green-500" : r === "D" ? "bg-gray-400" : "bg-red-500";

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className={`font-bold text-base mb-3 ${accent}`}>{title}</h3>
      <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
        <div><p className="font-bold text-xl">{form.record.wins}</p><p className="text-gray-400 text-xs">Victorias</p></div>
        <div><p className="font-bold text-xl">{form.record.draws}</p><p className="text-gray-400 text-xs">Empates</p></div>
        <div><p className="font-bold text-xl">{form.record.losses}</p><p className="text-gray-400 text-xs">Derrotas</p></div>
        <div><p className={`font-bold text-xl ${accent}`}>{form.points}</p><p className="text-gray-400 text-xs">Puntos</p></div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Prom. goles:</span>
        <span className="font-semibold">{form.avgGoalsPerMatch}</span>
        <div className="flex gap-1 ml-auto">
          {form.last5.map((r, i) => (
            <span key={i} className={`w-5 h-5 rounded-full ${resultColor(r)} text-white text-xs flex items-center justify-center font-bold`}>
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreatsCard({ title, threats }: { title: string; threats: TopThreat[] }) {
  const dangerColor = (r: string) =>
    r === "ALTO" ? "bg-red-100 text-red-700" : r === "MEDIO" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
      {threats.length === 0 ? (
        <p className="text-sm text-gray-400">Sin datos suficientes.</p>
      ) : (
        <ul className="space-y-3">
          {threats.map((t) => (
            <li key={t.playerId} className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-800 text-sm">{t.alias ? `"${t.alias}"` : t.player}</p>
                <p className="text-xs text-gray-400">
                  {t.goalsThisSeason} goles · {t.assists} asist · {t.goalsPerMatch}/partido
                </p>
                {t.goalsLast3Matches > 0 && (
                  <p className="text-xs text-green-600">{t.goalsLast3Matches} goles en últimos 3 partidos</p>
                )}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${dangerColor(t.dangerRating)}`}>
                {t.dangerRating}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CardRiskCard({
  homeTeam, awayTeam, homeRisk, awayRisk
}: {
  homeTeam: string;
  awayTeam: string;
  homeRisk: CardRiskPlayer[];
  awayRisk: CardRiskPlayer[];
}) {
  const allRisks = [
    ...homeRisk.map((r) => ({ ...r, team: homeTeam })),
    ...awayRisk.map((r) => ({ ...r, team: awayTeam })),
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-semibold text-gray-700 mb-3">🟨 Riesgo de tarjeta</h3>
      {allRisks.length === 0 ? (
        <p className="text-sm text-gray-400">Ningún jugador en riesgo de suspensión.</p>
      ) : (
        <ul className="space-y-2">
          {allRisks.map((r) => (
            <li key={r.playerId} className="text-sm">
              <p className="font-medium text-gray-800">{r.player} <span className="text-gray-400 text-xs">({r.team})</span></p>
              <p className="text-xs text-yellow-600">{r.note}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function H2HCard({ homeTeam, awayTeam, h2h }: {
  homeTeam: string;
  awayTeam: string;
  h2h: MatchPreview["headToHead"];
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-semibold text-gray-700 mb-3">🔁 Cara a cara</h3>
      {h2h.totalMatches === 0 ? (
        <p className="text-sm text-gray-400">Sin enfrentamientos previos.</p>
      ) : (
        <>
          <div className="flex justify-around text-center mb-3">
            <div>
              <p className="text-2xl font-bold text-green-600">{h2h.homeWins}</p>
              <p className="text-xs text-gray-400 truncate max-w-[80px]">{homeTeam}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">{h2h.draws}</p>
              <p className="text-xs text-gray-400">Empates</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{h2h.awayWins}</p>
              <p className="text-xs text-gray-400 truncate max-w-[80px]">{awayTeam}</p>
            </div>
          </div>
          {h2h.lastMatch && (
            <p className="text-xs text-gray-400 text-center border-t pt-2">
              Último: {h2h.lastMatch.result} · {h2h.lastMatch.date}
            </p>
          )}
        </>
      )}
    </div>
  );
}
