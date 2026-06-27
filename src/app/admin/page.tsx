import Link from "next/link";
import { ChevronRight, Plus, Trophy, User, Layers } from "lucide-react";
import { getActiveCity } from "@/shared/lib/active-city";
import { serverFetch } from "@/shared/lib/server-fetch";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatTile } from "@/shared/ui/StatTile";
import { StatusDot } from "@/shared/ui/StatusDot";
import { EmptyState } from "@/shared/ui/EmptyState";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type League = {
	id: string;
	name: string;
	dayOfWeek: string;
	season: string;
	status: "active" | "draft" | "finished";
	teams: unknown[];
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getDashboardData(city: string) {
	const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
	const [leaguesRes, playersRes] = await Promise.all([
		serverFetch(`${base}/api/leagues?city=${encodeURIComponent(city)}`, { cache: "no-store" }),
		serverFetch(`${base}/api/players?city=${encodeURIComponent(city)}`, { cache: "no-store" }),
	]);
	const leagues: League[] = leaguesRes.ok ? ((await leaguesRes.json()).data ?? []) : [];
	const playersData = playersRes.ok ? await playersRes.json() : null;
	const totalPlayers: number = playersData?.data?.meta?.total ?? playersData?.data?.length ?? 0;
	return { leagues, totalPlayers };
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
	const city = await getActiveCity();
	const { leagues, totalPlayers } = await getDashboardData(city);

	const activeLeagues = leagues.filter((l) => l.status === "active");
	const seasons = [...new Set(leagues.map((l) => l.season))];

	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<PageHeader
				breadcrumb={[{ label: "TalachaStats" }, { label: city }]}
				title="Dashboard"
				subtitle="Resumen de actividad"
				meta={
					activeLeagues.length > 0 ? (
						<StatusDot
							tone="active"
							label={`${activeLeagues.length} liga${activeLeagues.length !== 1 ? "s" : ""} activa${activeLeagues.length !== 1 ? "s" : ""}`}
						/>
					) : undefined
				}
				actions={
					<Link
						href="/admin/leagues/new"
						className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition"
					>
						<Plus size={16} strokeWidth={2} />
						Nueva liga
					</Link>
				}
			/>

			{/* Stats */}
			<section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<StatTile
					label="Ligas activas"
					value={activeLeagues.length}
					icon={Trophy}
					hint={
						leagues.length > activeLeagues.length
							? `${leagues.length - activeLeagues.length} en borrador`
							: undefined
					}
				/>
				<StatTile
					label="Jugadores registrados"
					value={totalPlayers}
					icon={User}
					hint={`${city} · todas las ligas`}
				/>
				<StatTile
					label="Temporadas"
					value={seasons.length}
					icon={Layers}
					hint={seasons.slice(0, 3).join(" · ") || undefined}
				/>
			</section>

			{/* Ligas */}
			<section className="flex flex-col gap-4">
				<div className="flex items-end justify-between">
					<div>
						<h2 className="font-display text-xl font-bold tracking-tight text-ink">Ligas</h2>
						{leagues.length > 0 && (
							<p className="text-sm text-ink-2 mt-0.5">
								{leagues.length} liga{leagues.length !== 1 ? "s" : ""} en {city}
								{leagues.length - activeLeagues.length > 0 && (
									<> — {leagues.length - activeLeagues.length} en borrador</>
								)}
							</p>
						)}
					</div>
					{leagues.length > 0 && (
						<Link
							href="/admin/leagues"
							className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink transition"
						>
							Ver todas <ChevronRight size={14} strokeWidth={2} />
						</Link>
					)}
				</div>

				{leagues.length === 0 ? (
					<EmptyState
						icon={Trophy}
						title="Sin ligas todavía"
						description="Crea tu primera liga para empezar a gestionar equipos y jugadores."
						action={
							<Link
								href="/admin/leagues/new"
								className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition"
							>
								<Plus size={16} strokeWidth={2} />
								Nueva liga
							</Link>
						}
					/>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{leagues.map((league) => (
							<LeagueCard key={league.id} league={league} />
						))}
						{/* Nueva liga — dashed */}
						<Link
							href="/admin/leagues/new"
							className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface/40 p-5 hover:border-brand/40 hover:bg-brand/[0.04] transition min-h-[124px]"
						>
							<span className="w-9 h-9 rounded-md border border-line group-hover:border-brand/40 grid place-items-center text-ink-3 group-hover:text-brand-ink transition">
								<Plus size={16} strokeWidth={2} />
							</span>
							<span className="text-sm font-semibold text-ink-2 group-hover:text-brand-ink transition">
								Nueva liga
							</span>
						</Link>
					</div>
				)}
			</section>
		</div>
	);
}

// ── LeagueCard ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { tone: "active" | "paused" | "inactive"; label: string }> = {
	active: { tone: "active", label: "Activa" },
	draft: { tone: "paused", label: "Borrador" },
	finished: { tone: "inactive", label: "Terminada" },
};

function LeagueCard({ league }: { league: League }) {
	const status = STATUS_MAP[league.status] ?? STATUS_MAP.draft;
	const teamsCount = league.teams?.length ?? 0;

	return (
		<Link
			href={`/admin/leagues/${league.id}`}
			className="group bg-surface border border-line rounded-lg p-5 hover:border-ink-3 transition flex flex-col gap-3"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="font-display text-[19px] font-bold tracking-tight text-ink leading-none truncate">
						{league.name}
					</h3>
					<p className="text-[13px] text-ink-2 mt-1.5 capitalize">
						{league.dayOfWeek} <span className="text-ink-3">·</span> {league.season}
					</p>
				</div>
				<StatusDot tone={status.tone} label={status.label} />
			</div>
			<div className="pt-3 border-t border-line flex items-center justify-between">
				<span className="text-[12px] text-ink-3">
					{teamsCount} equipo{teamsCount !== 1 ? "s" : ""}
				</span>
				<span className="text-[12px] font-semibold text-ink-2 group-hover:text-brand-ink transition flex items-center gap-1">
					Abrir <ChevronRight size={12} strokeWidth={2.25} />
				</span>
			</div>
		</Link>
	);
}
