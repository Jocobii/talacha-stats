import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Trophy, Target } from "lucide-react";
import {
	getPublicLeague,
	getLatestStandings,
	getLatestTopScorers,
	getPublicMatchdays,
	getLeagueZones,
} from "@/entities/organization";
import { db } from "@/db";
import { playoffBrackets } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { PublicBracket } from "./PublicBracketView";
import { titleCase } from "@/shared/lib/normalize";
import { findZone, getZoneTokens } from "@/shared/lib/zone-colors";
import ShareLeagueButton from "./ShareLeagueButton";
import ScorerCard from "./ScorerCard";
import TrialWarning from "./TrialWarning";
import LeaguePublicTabs from "./LeaguePublicTabs";

type Props = { params: Promise<{ slug: string; leagueSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, leagueSlug } = await params;
	const result = await getPublicLeague(slug, leagueSlug);
	if (!result) return { title: "Liga no encontrada" };
	const { org, league } = result;

	const title = `${titleCase(league.name)} — ${titleCase(org.name)}`;
	const description = `Tabla de posiciones, goleadores y estadísticas de ${titleCase(league.name)}. Temporada ${league.season}.`;

	// Next.js deduplica esta llamada con la del page — sin costo extra
	const { standings, jornada } = await getLatestStandings(league.id);

	const ogParams = new URLSearchParams({
		title: league.name,
		sub: `${titleCase(org.name)} · ${league.season}`,
		s1l: "Equipos",
		s1v: String(standings.length),
		...(jornada ? { s2l: "Jornada", s2v: `J${jornada}` } : {}),
	});
	const ogImageUrl = `/api/og?${ogParams.toString()}`;

	return {
		title: `${title} · TalachaStats`,
		description,
		openGraph: {
			title: `${title} · TalachaStats`,
			description,
			images: [{ url: ogImageUrl, width: 1200, height: 630, alt: league.name }],
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: `${title} · TalachaStats`,
			description,
			images: [ogImageUrl],
		},
	};
}

export default async function LeaguePublicPage({ params }: Props) {
	const { slug, leagueSlug } = await params;
	const result = await getPublicLeague(slug, leagueSlug);
	if (!result) notFound();

	const { org, league } = result;

	// Fetch paralelo — matchdays solo si schedulingEnabled
	const [{ standings, jornada }, scorers, matchdays, zones, bracketRows] = await Promise.all([
		getLatestStandings(league.id),
		getLatestTopScorers(league.id, 10),
		league.schedulingEnabled ? getPublicMatchdays(league.id) : Promise.resolve([]),
		getLeagueZones(league.id),
		db.query.playoffBrackets.findMany({
			where: eq(playoffBrackets.leagueId, league.id),
			orderBy: [asc(playoffBrackets.createdAt)],
			with: {
				slots: {
					with: {
						homeTeam: { columns: { id: true, name: true } },
						awayTeam: { columns: { id: true, name: true } },
						winner: { columns: { id: true, name: true } },
					},
				},
			},
		}),
	]);

	const brackets: PublicBracket[] = bracketRows.map((b) => ({
		id: b.id,
		zoneName: b.zoneName,
		zoneColor: b.zoneColor,
		slots: b.slots
			.sort((a, b) => a.round - b.round || a.slotIndex - b.slotIndex)
			.map((s) => ({
				id: s.id,
				round: s.round,
				slotIndex: s.slotIndex,
				isThirdPlace: s.isThirdPlace,
				isBye: s.isBye,
				homeTeam: s.homeTeam ?? null,
				awayTeam: s.awayTeam ?? null,
				winner: s.winner ?? null,
			})),
	}));

	const hasStandings = standings.length > 0;
	const hasScorers = scorers.length > 0;

	// ── Sección de posiciones (pasada como slot al tab) ──────────────────────
	const standingsSection = (
		<section>
			<SectionHeader
				icon={<Trophy size={16} strokeWidth={2} className="text-brand-ink" />}
				title="Posiciones"
			/>
			{!hasStandings ? (
				<EmptyState text="Aún no hay datos de posiciones para esta liga." />
			) : (
				<div className="bg-surface-2 border border-line rounded-2xl overflow-hidden">
					{/* Encabezados */}
					<div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] gap-1 px-3 py-2 border-b border-line">
						<span className="text-[10px] font-bold text-ink-3 text-center">#</span>
						<span className="text-[10px] font-bold text-ink-3">Equipo</span>
						<span className="text-[10px] font-bold text-ink-3 text-center">PJ</span>
						<span className="text-[10px] font-bold text-ink-3 text-center">G</span>
						<span className="text-[10px] font-bold text-ink-3 text-center">E</span>
						<span className="text-[10px] font-bold text-ink-3 text-center">P</span>
						<span className="text-[10px] font-bold text-brand-ink text-right">PTS</span>
					</div>

					{standings.map((row, idx) => {
						const pos = idx + 1;
						const zone = findZone(zones, pos);
						const tokens = zone ? getZoneTokens(zone.color) : null;
						const isZoneFirstRow = zone !== null && pos === zone.fromPosition;
						const isTop3 = idx < 3;
						return (
							<div key={row.id}>
								{/* Zone label — shown once at the start of each zone */}
								{isZoneFirstRow && tokens && zone && (
									<div
										className={`flex items-center gap-1.5 px-3 py-1 border-b border-line ${tokens.rowBg}`}
									>
										<span className={`w-1.5 h-1.5 rounded-full ${tokens.dot}`} />
										<span
											className={`text-[10px] font-bold uppercase tracking-wider ${tokens.badgeText}`}
										>
											{zone.name}
										</span>
									</div>
								)}
								<div
									className={`grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] gap-1 px-3 py-2.5 border-b border-line last:border-0 border-l-4 ${
										tokens
											? `${tokens.leftBorder} ${tokens.rowBg}`
											: `border-l-transparent ${isTop3 ? "bg-brand/4" : ""}`
									}`}
								>
									{/* Pos */}
									<div className="flex items-center justify-center">
										{isTop3 && !zone ? (
											<span className="w-5 h-5 rounded-md bg-brand/15 border border-brand/25 flex items-center justify-center font-display font-black text-[11px] text-brand-ink">
												{pos}
											</span>
										) : (
											<span
												className={`font-display font-black text-sm ${tokens ? tokens.badgeText : "text-ink-3"}`}
											>
												{pos}
											</span>
										)}
									</div>

									{/* Equipo */}
									<div className="flex items-center min-w-0">
										<span
											className={`text-sm font-semibold truncate ${isTop3 && !zone ? "text-ink" : "text-ink-2"}`}
										>
											{row.team.name}
										</span>
									</div>

									<span className="text-xs text-ink-3 text-center self-center">{row.played}</span>
									<span className="text-xs text-ink-3 text-center self-center">{row.wins}</span>
									<span className="text-xs text-ink-3 text-center self-center">{row.draws}</span>
									<span className="text-xs text-ink-3 text-center self-center">{row.losses}</span>
									<span
										className={`text-sm font-black text-right self-center ${isTop3 && !zone ? "text-brand-ink" : "text-ink"}`}
									>
										{row.points}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);

	// ── Sección de goleadores ────────────────────────────────────────────────
	const scorersSection = (
		<section>
			<SectionHeader
				icon={<Target size={16} strokeWidth={2} className="text-brand-ink" />}
				title="Goleadores"
			/>
			{!hasScorers ? (
				<EmptyState text="Aún no hay estadísticas de goleadores." />
			) : (
				<div className="space-y-1.5">
					{scorers.map((scorer, idx) => (
						<ScorerCard key={scorer.playerId ?? idx} scorer={scorer} rank={idx + 1} />
					))}
				</div>
			)}
		</section>
	);

	return (
		<div className="text-ink flex flex-col flex-1 bg-pitch">
			{/* ── Header ── */}
			<header className="relative px-5 pt-8 pb-0 max-w-lg mx-auto w-full overflow-hidden">
				<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
					<div
						style={{
							position: "absolute",
							top: "-30%",
							right: "-15%",
							width: "55%",
							height: "160%",
							background:
								"radial-gradient(ellipse at center, rgba(0,230,118,0.07) 0%, transparent 65%)",
						}}
					/>
				</div>

				<div className="relative z-10 pb-6">
					<Link
						href={`/org/${org.slug}`}
						className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
					>
						<ArrowLeft size={16} strokeWidth={2} />
						{org.name}
					</Link>

					<div className="flex items-start justify-between gap-3">
						<div>
							<h1 className="font-display font-black text-3xl uppercase tracking-tight leading-tight">
								{league.name}
							</h1>
							<p className="text-ink-3 text-sm mt-1">
								{league.season}
								{jornada && <span className="ml-2 text-brand-ink font-semibold">· J{jornada}</span>}
							</p>
						</div>
						<ShareLeagueButton title={league.name} />
					</div>
				</div>
			</header>

			{org.status === "trial" && <TrialWarning org={org} />}

			{/* ── Contenido con tabs ── */}
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-5 pb-16">
				<div className="max-w-lg mx-auto">
					<LeaguePublicTabs
						schedulingEnabled={league.schedulingEnabled}
						matchdays={matchdays}
						standingsSection={standingsSection}
						scorersSection={scorersSection}
						brackets={brackets}
					/>
				</div>
			</div>
		</div>
	);
}

// ── Pequeños helpers de UI ─────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
	return (
		<div className="flex items-center gap-2 mb-3">
			{icon}
			<h2 className="text-xs font-bold text-ink-3 uppercase tracking-widest">{title}</h2>
		</div>
	);
}

function EmptyState({ text }: { text: string }) {
	return (
		<div className="bg-surface-2 border border-line rounded-2xl p-6 text-center text-ink-3 text-sm">
			{text}
		</div>
	);
}
