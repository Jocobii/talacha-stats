import Link from "next/link";
import { getActiveCity } from "@/shared/lib/active-city";
import { serverFetch } from "@/shared/lib/server-fetch";

async function getLeagues(city: string) {
	const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
	const res = await serverFetch(`${base}/api/leagues?city=${encodeURIComponent(city)}`, {
		cache: "no-store",
	});
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

export default async function LeaguesPage() {
	const city = await getActiveCity();
	const leagues = await getLeagues(city);

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

			{leagues.length === 0 ? (
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
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{leagues.map(
						(league: {
							id: string;
							name: string;
							dayOfWeek: string;
							season: string;
							teams: unknown[];
							organization?: { name: string } | null;
						}) => (
							<Link
								key={league.id}
								href={`/admin/leagues/${league.id}`}
								className="bg-surface rounded-xl shadow p-5 hover:shadow-md transition border border-line block"
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
									<span className="bg-brand/15 text-brand text-xs font-medium px-2 py-0.5 rounded-full">
										{league.teams?.length ?? 0} equipos
									</span>
								</div>
								<p className="text-xs text-brand font-medium">Ver liga →</p>
							</Link>
						),
					)}
				</div>
			)}
		</div>
	);
}
