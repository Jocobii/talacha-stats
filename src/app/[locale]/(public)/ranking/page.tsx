import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Trophy, ArrowLeft } from "lucide-react";
import {
	getCityRanking,
	getLeagueRanking,
	getGlobalRanking,
	getCityLeagues,
} from "@/entities/player/ranking";
import type { RankingEntry } from "@/entities/player/ranking";
import CityFilter from "@/shared/ui/CityFilter";
import Pagination from "@/shared/ui/Pagination";
import PlayerSearch from "./PlayerSearch";
import LeagueSelector from "./LeagueSelector";
import { parsePaginationParams } from "@/shared/lib/pagination";

export const metadata: Metadata = {
	title: "Ranking — TalachaStats",
	description: "Los mejores goleadores de las ligas de fútbol amateur. Compárate con los demás.",
};

type Scope = "city" | "league" | "global";

export default async function RankingPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const params = await searchParams;
	const city = params.city ?? "Tijuana";
	const scope = (params.scope ?? "city") as Scope;
	const leagueId = params.leagueId ?? undefined;
	const pagination = parsePaginationParams(new URLSearchParams(params as Record<string, string>), {
		limit: 30,
	});

	const noLeagueSelected = scope === "league" && !leagueId;

	const rankingResult = noLeagueSelected
		? {
				items: [] as RankingEntry[],
				meta: { total: 0, page: 1, limit: 30, totalPages: 0, hasNext: false, hasPrev: false },
			}
		: scope === "league"
			? await getLeagueRanking(leagueId!, pagination)
			: scope === "global"
				? await getGlobalRanking(pagination)
				: await getCityRanking(city, pagination);

	const cityLeagues = scope === "league" ? await getCityLeagues(city) : [];

	const { items: ranking, meta } = rankingResult;
	const isFirstPage = pagination.page === 1;
	const hasPodium = isFirstPage && ranking.length >= 3 && !noLeagueSelected;
	const listItems = isFirstPage && hasPodium ? ranking.slice(3) : ranking;
	const globalOffset = (pagination.page - 1) * pagination.limit;

	const cityTabHref = `/ranking?scope=city&city=${encodeURIComponent(city)}`;
	const leagueTabHref = `/ranking?scope=league&city=${encodeURIComponent(city)}${leagueId ? `&leagueId=${leagueId}` : ""}`;
	const globalTabHref = `/ranking?scope=global`;

	return (
		<div className="text-ink flex flex-col flex-1 bg-pitch">
			{/* ── Header con fondo visual ── */}
			<header className="relative px-5 pt-8 pb-0 max-w-lg mx-auto w-full overflow-hidden">
				{/* Fondo: líneas de cancha + glow */}
				<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
					<svg
						className="absolute inset-0 w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="xMidYMid slice"
					>
						<circle
							cx="88%"
							cy="55%"
							r="70"
							fill="none"
							stroke="#00E676"
							strokeWidth="1"
							opacity="0.09"
						/>
						<circle
							cx="88%"
							cy="55%"
							r="35"
							fill="none"
							stroke="#00E676"
							strokeWidth="0.8"
							opacity="0.06"
						/>
						<circle cx="88%" cy="55%" r="5" fill="#00E676" opacity="0.12" />
						<line
							x1="0"
							y1="55%"
							x2="100%"
							y2="55%"
							stroke="#00E676"
							strokeWidth="0.6"
							opacity="0.04"
						/>
					</svg>
					<div
						style={{
							position: "absolute",
							top: "-30%",
							right: "-15%",
							width: "55%",
							height: "160%",
							background:
								"radial-gradient(ellipse at center, rgba(0,230,118,0.08) 0%, transparent 65%)",
						}}
					/>
				</div>

				{/* Contenido del header */}
				<div className="relative z-10">
					<Link
						href="/"
						className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
					>
						<ArrowLeft size={16} strokeWidth={2} />
						Inicio
					</Link>

					<div className="flex items-start justify-between gap-3 pb-6">
						<div>
							<div className="flex items-center gap-2 mb-1">
								<Trophy size={24} className="text-brand-ink" strokeWidth={2} />
								<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
									Ranking
								</h1>
							</div>
							<p className="text-ink-2 text-sm">
								{noLeagueSelected
									? "Selecciona una liga"
									: `${meta.total} jugadores · Fútbol Amateur`}
								{!noLeagueSelected && meta.totalPages > 1 && (
									<span className="ml-2 text-ink-3">
										· pág. {meta.page}/{meta.totalPages}
									</span>
								)}
							</p>
						</div>
						{scope !== "global" && (
							<div className="shrink-0 pt-1">
								<CityFilter />
							</div>
						)}
					</div>
				</div>
			</header>

			{/* ── Contenido ── */}
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-5 pb-16">
				<div className="max-w-lg mx-auto">
					{/* Scope tabs */}
					<div className="flex gap-1 bg-surface-2 border border-line p-1 rounded-xl mb-4">
						<ScopeTab href={cityTabHref} active={scope === "city"}>
							Ciudad
						</ScopeTab>
						<ScopeTab href={leagueTabHref} active={scope === "league"}>
							Liga
						</ScopeTab>
						<ScopeTab href={globalTabHref} active={scope === "global"}>
							Nacional
						</ScopeTab>
					</div>

					{scope === "league" && (
						<Suspense>
							<LeagueSelector leagues={cityLeagues} city={city} current={leagueId} />
						</Suspense>
					)}

					{!noLeagueSelected && (
						<Suspense>
							<PlayerSearch
								city={scope !== "global" ? city : ""}
								leagueId={scope === "league" ? leagueId : undefined}
							/>
						</Suspense>
					)}

					{/* Estado vacío */}
					{noLeagueSelected ? (
						<div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
							Elige una liga del selector de arriba para ver el ranking.
						</div>
					) : meta.total === 0 ? (
						<div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
							Aún no hay estadísticas registradas.
						</div>
					) : (
						<div className="space-y-2">
							{/* ── Podium top 3 ── */}
							{hasPodium && (
								<div className="grid grid-cols-3 gap-2 mb-3 items-end">
									{/* #2 — izquierda */}
									<PodiumCard entry={ranking[1]} pos={2} />

									{/* #1 — centro, más alto */}
									<PodiumCard entry={ranking[0]} pos={1} />

									{/* #3 — derecha */}
									<PodiumCard entry={ranking[2]} pos={3} />
								</div>
							)}

							{/* Divisor sección Top 10 si aplica */}
							{hasPodium && listItems.some((_, i) => globalOffset + i + 4 <= 10) && (
								<div className="flex items-center gap-3 py-1 mb-1">
									<div className="flex-1 h-px bg-line" />
									<span className="text-[10px] font-bold text-brand-ink uppercase tracking-widest">
										Top 10
									</span>
									<div className="flex-1 h-px bg-line" />
								</div>
							)}

							{/* ── Lista ── */}
							{listItems.map((entry, idx) => {
								const position = hasPodium ? globalOffset + idx + 4 : globalOffset + idx + 1;

								// Inyectar divisor entre top 10 y el resto
								const isFirstAfterTop10 = position === 11 && hasPodium;

								return (
									<div key={entry.playerId}>
										{isFirstAfterTop10 && (
											<div className="flex items-center gap-3 py-2">
												<div className="flex-1 h-px bg-line" />
												<span className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest">
													Clasificados
												</span>
												<div className="flex-1 h-px bg-line" />
											</div>
										)}
										<RankRow entry={entry} position={position} showCity={scope === "global"} />
									</div>
								);
							})}

							{meta.totalPages > 1 && (
								<Suspense>
									<Pagination meta={meta} className="pt-4" />
								</Suspense>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ── Podium card ────────────────────────────────────────────────────────────────

const PODIUM_CONFIG = {
	1: {
		rankSize: "text-7xl",
		goalsSize: "text-4xl",
		goalsColor: "text-brand-ink",
		cardClass: "bg-brand/6 border border-brand/30 hover:border-brand/50",
		avatarClass: "bg-brand text-pitch",
		label: "CAMPEÓN",
		labelClass: "text-brand-ink border-brand/30 bg-brand/10",
		height: "pb-5 pt-4",
		// Gradiente de fuego: amarillo brillante arriba → naranja → rojo abajo
		rankGradient: "linear-gradient(180deg, #FFE566 0%, #FFA500 35%, #FF5722 68%, #CC2200 100%)",
		rankAnim: "fireText1 2s ease-in-out infinite",
	},
	2: {
		rankSize: "text-5xl",
		goalsSize: "text-3xl",
		goalsColor: "text-ink",
		cardClass: "bg-surface-2 border border-line hover:border-brand/30",
		avatarClass: "bg-surface border border-line text-ink-2",
		label: "2° LUGAR",
		labelClass: "text-ink-3 border-line bg-surface",
		height: "pb-4 pt-3",
		rankGradient: "linear-gradient(180deg, #FFD060 0%, #FF8C00 45%, #FF6035 100%)",
		rankAnim: "fireText2 2.6s ease-in-out infinite",
	},
	3: {
		rankSize: "text-5xl",
		goalsSize: "text-3xl",
		goalsColor: "text-ink-2",
		cardClass: "bg-surface-2 border border-line hover:border-brand/30",
		avatarClass: "bg-surface border border-line text-ink-3",
		label: "3° LUGAR",
		labelClass: "text-ink-3 border-line bg-surface",
		height: "pb-4 pt-3",
		rankGradient: "linear-gradient(180deg, #FFBA60 0%, #FF8A65 55%, #FF7043 100%)",
		rankAnim: "fireText3 3.2s ease-in-out infinite",
	},
} as const;

function PodiumCard({ entry, pos }: { entry: RankingEntry; pos: 1 | 2 | 3 }) {
	const cfg = PODIUM_CONFIG[pos];

	return (
		<Link
			href={`/player/${entry.playerId}`}
			className={`relative flex flex-col items-center text-center rounded-2xl px-2 ${cfg.height} ${cfg.cardClass} transition`}
		>
			{/* Label de posición */}
			<span
				className={`inline-block text-[9px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 mb-2 ${cfg.labelClass}`}
			>
				{cfg.label}
			</span>

			{/* Número de posición — protagonista */}
			<span className={`font-display font-black leading-none ${cfg.rankSize}`}>{pos}</span>

			{/* Separador */}
			<div className="w-8 h-px bg-line my-2.5" />

			{/* Avatar */}
			<div
				className={`w-11 h-11 rounded-full flex items-center justify-center font-display font-black text-lg mb-2 shrink-0 ${cfg.avatarClass}`}
			>
				{(entry.alias ?? entry.fullName).charAt(0).toUpperCase()}
			</div>

			{/* Nombre */}
			<p className="text-xs font-semibold text-ink leading-tight line-clamp-2 w-full px-1 mb-1">
				{entry.alias ? `"${entry.alias}"` : entry.fullName}
			</p>

			{/* Ciudad en scope global */}
			{entry.cities && entry.cities.length > 0 && (
				<p className="text-[10px] text-ink-3 mb-1">{entry.cities[0]}</p>
			)}

			{/* Goles */}
			<p className={`font-display font-black leading-none ${cfg.goalsSize} ${cfg.goalsColor} mt-1`}>
				{entry.totalGoals}
			</p>
			<p className="text-[10px] text-ink-3 mt-0.5">goles</p>

			{/* Ratio + delta */}
			{entry.totalMatches > 0 && (
				<p className="text-[10px] text-ink-3 mt-0.5">{entry.goalsPerMatch.toFixed(2)}/PJ</p>
			)}
			<div className="mt-1">
				<DeltaBadge delta={entry.positionDelta} isNew={entry.isNew} />
			</div>
		</Link>
	);
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function DeltaBadge({ delta, isNew }: { delta: number | null; isNew: boolean }) {
	if (isNew) {
		return (
			<span className="text-[10px] font-bold text-brand-ink uppercase tracking-wide">NEW</span>
		);
	}
	if (delta === null || delta === 0) return null;
	const up = delta > 0;
	return (
		<span
			className={`flex items-center gap-0.5 text-[11px] font-bold ${up ? "text-green-400" : "text-red-400"}`}
		>
			<svg width="8" height="7" viewBox="0 0 8 7" fill="currentColor">
				{up ? <polygon points="4,0 8,7 0,7" /> : <polygon points="0,0 8,0 4,7" />}
			</svg>
			{Math.abs(delta)}
		</span>
	);
}

// ── Scope tab ─────────────────────────────────────────────────────────────────

function ScopeTab({
	href,
	active,
	children,
}: {
	href: string;
	active: boolean;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className={`flex-1 text-center text-xs font-semibold py-2 rounded-lg transition ${
				active ? "bg-brand text-pitch shadow-sm" : "text-ink-3 hover:text-ink"
			}`}
		>
			{children}
		</Link>
	);
}

// ── Rank row ──────────────────────────────────────────────────────────────────

function RankRow({
	entry,
	position,
	showCity,
}: {
	entry: RankingEntry;
	position: number;
	showCity: boolean;
}) {
	const isTop10 = position <= 10;

	return (
		<Link
			href={`/player/${entry.playerId}`}
			className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
				isTop10
					? "bg-surface-2 border border-brand/20 hover:border-brand/50"
					: "bg-surface-2 border border-line hover:border-brand/30"
			}`}
		>
			{/* Posición — badge brand para top 10, plano para el resto */}
			{isTop10 ? (
				<div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/25 flex items-center justify-center shrink-0">
					<span className="font-display font-black text-base text-brand-ink leading-none">
						{position}
					</span>
				</div>
			) : (
				<div className="w-8 text-center shrink-0 font-display font-black text-lg text-ink-3">
					{position}
				</div>
			)}

			{/* Avatar */}
			<div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-base shrink-0">
				{(entry.alias ?? entry.fullName).charAt(0).toUpperCase()}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-ink truncate text-sm">
					{entry.alias ? `"${entry.alias}"` : entry.fullName}
				</p>
				<p className="text-xs text-ink-2 truncate">
					{entry.topTeam} · {entry.topLeague}
					{showCity && entry.cities && entry.cities.length > 0 && (
						<span className="ml-1 text-ink-3">· {entry.cities[0]}</span>
					)}
					{entry.leaguesCount > 1 && (
						<span className="ml-1 text-brand-ink font-medium">
							+{entry.leaguesCount - 1} liga{entry.leaguesCount - 1 !== 1 ? "s" : ""}
						</span>
					)}
				</p>
			</div>

			{/* Goles */}
			<div className="text-right shrink-0 flex flex-col items-end gap-0.5">
				<p
					className={`font-display font-black text-2xl leading-none ${isTop10 ? "text-brand-ink" : "text-ink"}`}
				>
					{entry.totalGoals}
				</p>
				<p className="text-[10px] text-ink-3">goles</p>
				{entry.totalMatches > 0 && (
					<p className="text-[10px] text-ink-3">{entry.goalsPerMatch.toFixed(2)}/PJ</p>
				)}
				<DeltaBadge delta={entry.positionDelta} isNew={entry.isNew} />
			</div>
		</Link>
	);
}
