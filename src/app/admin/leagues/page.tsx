import Link from "next/link";
import { getActiveCity } from "@/shared/lib/active-city";
import { serverFetch } from "@/shared/lib/server-fetch";

async function fetchLeagues(city: string, status: "active" | "finished"): Promise<LeagueRow[]> {
	const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
	const url = `${base}/api/leagues?city=${encodeURIComponent(city)}&status=${status}`;
	const res = await serverFetch(url, { cache: "no-store" });
	return res.ok ? ((await res.json()).data ?? []) : [];
}

const DAY_LABELS: Record<string, string> = {
	lunes: "Lunes",
	martes: "Martes",
	miercoles: "Miércoles",
	jueves: "Jueves",
	viernes: "Viernes",
	sabado: "Sábado",
	domingo: "Domingo",
};

type LeagueRow = {
	id: string;
	name: string;
	dayOfWeek: string;
	season: string;
	status: string;
	teams: unknown[];
	organization?: { name: string } | null;
};

function LeagueCard({ league, finished = false }: { league: LeagueRow; finished?: boolean }) {
	return (
		<Link
			key={league.id}
			href={`/admin/leagues/${league.id}`}
			className={`bg-surface rounded-xl shadow p-5 hover:shadow-md transition border block ${
				finished ? "border-line opacity-60 hover:opacity-80" : "border-line"
			}`}
		>
			<div className="flex items-start justify-between mb-3">
				<div>
					{league.organization && (
						<p className="text-xs text-ink-3 mb-0.5">{league.organization.name}</p>
					)}
					<p className="font-semibold text-ink">{league.name}</p>
					<p className="text-sm text-ink-2">
						{DAY_LABELS[league.dayOfWeek] ?? league.dayOfWeek} · {league.season}
					</p>
				</div>
				<div className="flex flex-col items-end gap-1">
					<span className="bg-brand/15 text-brand text-xs font-medium px-2 py-0.5 rounded-full">
						{(league.teams as unknown[])?.length ?? 0} equipos
					</span>
					{finished && (
						<span className="bg-surface-2 text-ink-3 text-xs font-medium px-2 py-0.5 rounded-full">
							Terminada
						</span>
					)}
				</div>
			</div>
			<p className="text-xs text-brand font-medium">Ver liga →</p>
		</Link>
	);
}

export default async function LeaguesPage() {
	const city = await getActiveCity();
	const [active, finished] = await Promise.all([
		fetchLeagues(city, "active"),
		fetchLeagues(city, "finished"),
	]);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-ink">Ligas</h1>
					<p className="text-sm text-ink-3 mt-0.5">{city}</p>
				</div>
				<Link
					href="/admin/leagues/new"
					className="bg-brand text-pitch px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dim"
				>
					+ Nueva liga
				</Link>
			</div>

			{active.length === 0 && finished.length === 0 ? (
				<div className="bg-surface rounded-xl shadow p-12 text-center">
					<p className="text-4xl mb-4">⚽</p>
					<p className="text-ink-2 font-medium mb-1">No hay ligas en {city}</p>
					<p className="text-ink-3 text-sm mb-6">Crea la primera liga para esta ciudad</p>
					<Link
						href="/admin/leagues/new"
						className="bg-brand text-pitch px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dim"
					>
						Crear liga
					</Link>
				</div>
			) : (
				<div className="space-y-8">
					{/* Ligas activas */}
					{active.length > 0 && (
						<div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{active.map((league) => (
									<LeagueCard key={league.id} league={league} />
								))}
							</div>
						</div>
					)}

					{active.length === 0 && (
						<div className="bg-surface rounded-xl shadow p-8 text-center border border-line">
							<p className="text-ink-2 font-medium mb-1">No hay ligas activas</p>
							<p className="text-ink-3 text-sm mb-4">Todas las ligas han terminado su temporada</p>
							<Link
								href="/admin/leagues/new"
								className="bg-brand text-pitch px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-dim"
							>
								Crear nueva liga
							</Link>
						</div>
					)}

					{/* Temporadas anteriores */}
					{finished.length > 0 && (
						<div>
							<h2 className="text-sm font-semibold text-ink-3 uppercase tracking-wider mb-3">
								Temporadas anteriores
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{finished.map((league) => (
									<LeagueCard key={league.id} league={league} finished />
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
