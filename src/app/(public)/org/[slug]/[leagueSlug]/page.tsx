import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Trophy, Target } from "lucide-react";
import {
	getPublicLeague,
	getLatestStandings,
	getLatestTopScorers,
	getStandingsHistory,
} from "@/entities/organization";
import { titleCase } from "@/shared/lib/normalize";
import ShareLeagueButton from "./ShareLeagueButton";
import ScorerCard, { type ScorerData } from "./ScorerCard";
import TrialWarning from "./TrialWarning";

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

	// Fetch paralelo
	const [{ standings, jornada }, scorers] = await Promise.all([
		getLatestStandings(league.id),
		getLatestTopScorers(league.id, 10),
		getStandingsHistory(league.id),
	]);

	const hasStandings = standings.length > 0;
	const hasScorers = scorers.length > 0;

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
								{jornada && <span className="ml-2 text-brand font-semibold">· J{jornada}</span>}
							</p>
						</div>
						<ShareLeagueButton title={league.name} />
					</div>
				</div>
			</header>
			{org.status === "trial" && <TrialWarning org={org} />}
			{/* ── Contenido ── */}
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-5 pb-16">
				<div className="max-w-lg mx-auto space-y-6">
					{/* ── Tabla de posiciones ── */}
					<section>
						<SectionHeader
							icon={<Trophy size={16} strokeWidth={2} className="text-brand" />}
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
									<span className="text-[10px] font-bold text-brand text-right">PTS</span>
								</div>

								{standings.map((row, idx) => {
									const isTop3 = idx < 3;
									return (
										<div
											key={row.id}
											className={`grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] gap-1 px-3 py-2.5 border-b border-line last:border-0 ${isTop3 ? "bg-brand/4" : ""
												}`}
										>
											{/* Pos */}
											<div className="flex items-center justify-center">
												{isTop3 ? (
													<span className="w-5 h-5 rounded-md bg-brand/15 border border-brand/25 flex items-center justify-center font-display font-black text-[11px] text-brand">
														{idx + 1}
													</span>
												) : (
													<span className="font-display font-black text-sm text-ink-3">
														{idx + 1}
													</span>
												)}
											</div>

											{/* Equipo */}
											<div className="flex items-center min-w-0">
												<span
													className={`text-sm font-semibold truncate ${isTop3 ? "text-ink" : "text-ink-2"}`}
												>
													{row.team.name}
												</span>
											</div>

											<span className="text-xs text-ink-3 text-center self-center">
												{row.played}
											</span>
											<span className="text-xs text-ink-3 text-center self-center">{row.wins}</span>
											<span className="text-xs text-ink-3 text-center self-center">
												{row.draws}
											</span>
											<span className="text-xs text-ink-3 text-center self-center">
												{row.losses}
											</span>
											<span
												className={`text-sm font-black text-right self-center ${isTop3 ? "text-brand" : "text-ink"}`}
											>
												{row.points}
											</span>
										</div>
									);
								})}
							</div>
						)}
					</section>

					{/* ── Goleadores ── */}
					<section>
						<SectionHeader
							icon={<Target size={16} strokeWidth={2} className="text-brand" />}
							title="Goleadores"
						/>

						{!hasScorers ? (
							<EmptyState text="Aún no hay estadísticas de goleadores." />
						) : (
							<div className="space-y-1.5">
								{scorers.map((scorer: ScorerData, idx: number) => (
									<ScorerCard key={scorer.playerId} scorer={scorer} rank={idx + 1} />
								))}
							</div>
						)}
					</section>
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
