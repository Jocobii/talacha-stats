import Link from "next/link";
import { getActiveCity } from "@/shared/lib/active-city";
import { serverFetch } from "@/shared/lib/server-fetch";

async function getDashboardData(city: string) {
	const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
	const [leaguesRes, playersRes] = await Promise.all([
		serverFetch(`${base}/api/leagues?city=${encodeURIComponent(city)}`, { cache: "no-store" }),
		serverFetch(`${base}/api/players?city=${encodeURIComponent(city)}`, { cache: "no-store" }),
	]);
	const leagues = leaguesRes.ok ? ((await leaguesRes.json()).data ?? []) : [];
	const players = playersRes.ok ? ((await playersRes.json()).data ?? []) : [];
	return { leagues, players };
}

export default async function AdminDashboard() {
	const city = await getActiveCity();
	const { leagues, players } = await getDashboardData(city);

	return (
		<div>
			<h1 className="text-2xl font-bold text-ink mb-6">Dashboard</h1>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
				<StatCard label="Ligas activas" value={leagues.length} color="bg-brand/15 text-brand" />
				<StatCard
					label="Jugadores registrados"
					value={players.meta?.total ?? players.length}
					color="bg-blue-950/60 text-blue-300"
				/>
				<StatCard
					label="Temporadas"
					value={[...new Set(leagues.map((l: { season: string }) => l.season))].length}
					color="bg-yellow-950/60 text-yellow-300"
				/>
			</div>

			<h2 className="text-lg font-semibold text-ink mb-3">Ligas</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{leagues.map(
					(league: {
						id: string;
						name: string;
						dayOfWeek: string;
						season: string;
						teams: unknown[];
					}) => (
						<Link
							key={league.id}
							href={`/admin/leagues/${league.id}`}
							className="bg-surface rounded-lg shadow p-4 hover:shadow-md transition border border-line"
						>
							<p className="font-semibold text-ink">{league.name}</p>
							<p className="text-sm text-ink-2 capitalize">
								{league.dayOfWeek} — {league.season}
							</p>
							<p className="text-xs text-ink-3 mt-1">{league.teams?.length ?? 0} equipos</p>
						</Link>
					),
				)}
				<Link
					href="/admin/leagues"
					className="bg-brand/10 border-2 border-dashed border-brand/30 rounded-lg p-4 flex items-center justify-center text-brand hover:bg-brand/15 transition"
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
