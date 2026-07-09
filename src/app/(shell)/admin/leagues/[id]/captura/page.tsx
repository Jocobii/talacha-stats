/**
 * app/admin/leagues/[id]/captura/page.tsx
 *
 * Tab "Captura" — lista de jornadas con progreso de captura de resultados.
 * Cada jornada muestra cuántos partidos están capturados y un botón para
 * ir al dashboard de captura.
 */
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { db } from "@/db";
import { leagues, matchdays, matches } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";

export const metadata = { title: "Captura de resultados · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

type JornadaSummary = {
	id: string;
	number: number;
	scheduledDate: string;
	phase: string;
	total: number;
	captured: number;
};

const CAPTURED_STATUSES = new Set([
	"played",
	"walkover_home",
	"walkover_away",
	"suspended",
	"postponed",
	"completed",
]);

async function fetchJornadas(leagueId: string): Promise<JornadaSummary[]> {
	const mdRows = await db.query.matchdays.findMany({
		where: eq(matchdays.leagueId, leagueId),
		orderBy: [asc(matchdays.number)],
	});
	if (mdRows.length === 0) return [];

	const matchRows = await db.query.matches.findMany({
		where: eq(matches.leagueId, leagueId),
		columns: { id: true, matchdayId: true, status: true },
	});

	const countByMatchday = new Map<string, { total: number; captured: number }>();
	for (const m of matchRows) {
		if (!m.matchdayId) continue;
		const cur = countByMatchday.get(m.matchdayId) ?? { total: 0, captured: 0 };
		cur.total += 1;
		if (CAPTURED_STATUSES.has(m.status)) cur.captured += 1;
		countByMatchday.set(m.matchdayId, cur);
	}

	return mdRows.map((md) => {
		const counts = countByMatchday.get(md.id) ?? { total: 0, captured: 0 };
		return {
			id: md.id,
			number: md.number,
			scheduledDate: md.scheduledDate,
			phase: md.phase,
			...counts,
		};
	});
}

function formatDate(iso: string): string {
	const [year, month, day] = iso.split("-");
	const d = new Date(Number(year), Number(month) - 1, Number(day));
	return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

export default async function CapturaPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, organizationId: true },
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const jornadas = await fetchJornadas(id);
	const regular = jornadas.filter((j) => j.phase === "regular");
	const extra = jornadas.filter((j) => j.phase !== "regular");

	if (jornadas.length === 0) {
		return (
			<div className="bg-surface rounded-lg shadow p-10 text-center space-y-3">
				<ClipboardList className="mx-auto text-ink-3" size={36} />
				<p className="text-ink-2 text-sm">No hay jornadas aún. Genera el calendario primero.</p>
				<Link
					href={`/admin/leagues/${id}/sorteo`}
					className="inline-block text-sm text-brand-ink hover:underline font-medium"
				>
					Ir al sorteo →
				</Link>
			</div>
		);
	}

	const renderList = (list: JornadaSummary[]) =>
		list.map((j) => {
			const pct = j.total > 0 ? Math.round((j.captured / j.total) * 100) : 0;
			const allDone = j.total > 0 && j.captured === j.total;

			return (
				<div key={j.id} className="bg-surface rounded-lg shadow px-5 py-4 flex items-center gap-4">
					{/* Número de jornada */}
					<div className="w-10 shrink-0 text-center">
						<span className="text-lg font-bold text-ink">{j.number}</span>
					</div>

					{/* Info + barra de progreso */}
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between mb-1">
							<span className="text-sm font-medium text-ink capitalize">
								{j.phase !== "regular" ? "🔄 Recuperación · " : ""}
								{formatDate(j.scheduledDate)}
							</span>
							<span
								className={`text-xs font-semibold ${allDone ? "text-green-600" : "text-ink-2"}`}
							>
								{j.captured}/{j.total} capturados
							</span>
						</div>
						<div className="w-full bg-surface-2 rounded-full h-1.5 border border-line">
							<div
								className={`h-1.5 rounded-full transition-all ${allDone ? "bg-green-500" : "bg-brand"}`}
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>

					{/* Botón de acción */}
					<Link
						href={`/admin/ligas/${id}/jornadas/${j.id}`}
						className={`shrink-0 text-sm font-semibold px-4 py-2 rounded transition-colors ${
							allDone
								? "bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line"
								: "bg-green-600 hover:bg-green-700 text-white"
						}`}
					>
						{allDone ? "Ver" : j.captured === 0 ? "Capturar" : "Continuar"}
					</Link>
				</div>
			);
		});

	return (
		<div className="space-y-3">
			{renderList(regular)}
			{extra.length > 0 && (
				<>
					<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mt-6 mb-2">
						Jornadas de recuperación
					</h2>
					{renderList(extra)}
				</>
			)}
		</div>
	);
}
