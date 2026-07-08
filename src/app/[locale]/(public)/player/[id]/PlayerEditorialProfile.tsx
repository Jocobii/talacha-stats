/**
 * app/(public)/player/[id]/PlayerEditorialProfile.tsx
 *
 * Reemplaza CityRankCard + StatsHero + BadgesGrid + StreakCard
 * en `page.tsx`. PlayerTabs (Temporada/Carrera) puede quedarse abajo.
 *
 * Es Server Component — sin hooks, sin animaciones JS (los números
 * salen estáticos, que es lo correcto para SSR + Open Graph).
 *
 * Usa los tokens que ya tienes en `globals.css`:
 *   bg-pitch / bg-surface / bg-surface-2 / border-line
 *   text-ink / text-ink-2 / text-ink-3 / text-brand
 *   font-display (Barlow Condensed) / font-body (Space Grotesk)
 */

import { getTranslations } from "next-intl/server";
import type { PlayerView, PlayerLeagueStats } from "@/entities/player";
import type { PlayerEgoStats } from "@/entities/player";
import ShareFooter from "./ShareFooter";

type Translator = Awaited<ReturnType<typeof getTranslations>>;

// ──────────────────────────────────────────────────────────────────────
// "EL CEREBRO": qué hero stat / qué logro principal mostrar
// ──────────────────────────────────────────────────────────────────────

type Achievement = { title: string; rank: string; short: string };
type Hero = { value: number | string; label: string };

function pickAchievement(view: PlayerView, ego: PlayerEgoStats, t: Translator): Achievement | null {
	const g = view.global;
	const pos = ego.positions;
	const isFemenil = isFemenilProfile(view);

	const goleadorLabel = t(isFemenil ? "achievement.goleador.female" : "achievement.goleador.male");

	// #1 de su ciudad — el flex máximo
	if (pos.city?.rank === 1 && pos.city.goals > 0) {
		return {
			title: t("achievement.cityTitle", {
				label: goleadorLabel,
				city: pos.city.cityName.toUpperCase(),
			}),
			rank: "#1",
			short: goleadorLabel,
		};
	}
	// Top 10% de la ciudad
	if (ego.cityTopPercent !== null && ego.cityTopPercent <= 10 && pos.city) {
		return {
			title: t("achievement.topPercentTitle", {
				percent: ego.cityTopPercent,
				city: pos.city.cityName.toUpperCase(),
			}),
			rank: t("achievement.topPercentRank", { percent: ego.cityTopPercent }),
			short: goleadorLabel,
		};
	}
	// #1 de su liga
	if (pos.league?.rank === 1 && pos.league.goals > 0) {
		return {
			title: t("achievement.leagueTitle", { label: goleadorLabel }),
			rank: "#1",
			short: goleadorLabel,
		};
	}
	// Artillero: gol por partido o más
	if (g.goalsPerMatch >= 1 && g.totalMatches >= 5) {
		const artilleroLabel = t(
			isFemenil ? "achievement.artillero.female" : "achievement.artillero.male",
		);
		return {
			title: artilleroLabel,
			rank: `${g.goalsPerMatch.toFixed(2)} G/PJ`,
			short: "ARTILLERO",
		};
	}
	// Racha
	if (ego.goalStreak >= 3) {
		return {
			title: t("achievement.racha"),
			rank: t("achievement.rankMatches", { count: ego.goalStreak }),
			short: "RACHA",
		};
	}
	// Multiligas
	if (g.leaguesCount >= 2) {
		return {
			title: t("achievement.multiligas"),
			rank: t("achievement.rankLigas", { count: g.leaguesCount }),
			short: "MULTILIGAS",
		};
	}
	// Veterano — más de 25 PJ
	if (g.totalMatches >= 25) {
		return {
			title: t(isFemenil ? "achievement.veterano.female" : "achievement.veterano.male"),
			rank: t("achievement.rankMatches", { count: g.totalMatches }),
			short: "VETERANO",
		};
	}
	// Fijo en el XI (10+ partidos en su liga principal)
	if (g.totalMatches >= 10) {
		return {
			title: t("achievement.titular"),
			rank: t("achievement.rankMatches", { count: g.totalMatches }),
			short: "TITULAR",
		};
	}
	// Mínimo: activo en temporada
	if (g.totalMatches > 0) {
		return {
			title: t("achievement.activo"),
			rank: t("achievement.rankMatches", { count: g.totalMatches }),
			short: "ACTIVO",
		};
	}
	return null;
}

function pickHero(view: PlayerView, t: Translator): Hero {
	const g = view.global;

	// Mediocampista típico: más asistencias que goles → G+A es el flex
	if (g.totalAssists > g.totalGoals && g.totalContributions > 0) {
		return { value: g.totalContributions, label: t("hero.goalsAndAssists") };
	}
	// Goleador / standard
	if (g.totalGoals > 0) {
		return { value: g.totalGoals, label: t("hero.totalGoals") };
	}
	// Jugador sin goles: presumir asistencias
	if (g.totalAssists > 0) {
		return { value: g.totalAssists, label: t("hero.assists") };
	}
	// Sin contribuciones, presumir presencia
	if (g.totalMatches > 0) {
		return { value: g.totalMatches, label: t("hero.matchesPlayed") };
	}
	return { value: 0, label: t("hero.debutPending") };
}

function pickSecondaryStats(view: PlayerView, hero: Hero, t: Translator) {
	const g = view.global;
	const stats: { value: string | number; label: string }[] = [];

	// No repetir el hero
	if (hero.label !== t("hero.totalGoals") && g.totalGoals > 0) {
		stats.push({ value: g.totalGoals, label: t("secondary.goals") });
	}
	if (g.goalsPerMatch > 0 && g.totalMatches >= 3) {
		stats.push({ value: g.goalsPerMatch.toFixed(2), label: t("secondary.goalsPerMatch") });
	}
	if (g.totalMatches > 0) {
		stats.push({ value: g.totalMatches, label: t("secondary.matches") });
	}
	stats.push({
		value: g.leaguesCount,
		label: t(g.leaguesCount === 1 ? "secondary.league" : "secondary.leagues"),
	});

	return stats.slice(0, 3);
}

function pickAcreditaciones(
	view: PlayerView,
	ego: PlayerEgoStats,
	t: Translator,
): { l: string; n: string }[] {
	const out: string[] = [];

	if (ego.positions.league?.rank === 1) out.push(t("acreditaciones.leagueScorer"));
	if (view.global.leaguesCount >= 2) {
		out.push(t("acreditaciones.activeInLeagues", { count: view.global.leaguesCount }));
	}
	if (ego.hatTricks > 0) {
		out.push(
			ego.hatTricks === 1
				? t("acreditaciones.hatTrick")
				: t("acreditaciones.hatTricks", { count: ego.hatTricks }),
		);
	}
	if (ego.goalStreak >= 3) {
		out.push(t("acreditaciones.streak", { count: ego.goalStreak }));
	}
	if (view.global.goalsPerMatch >= 1 && view.global.totalMatches >= 5) {
		out.push(t("acreditaciones.averageGoal"));
	}
	if (view.global.totalMatches >= 25) {
		out.push(t("acreditaciones.veteran", { count: view.global.totalMatches }));
	}

	if (out.length === 0 && view.global.totalMatches > 0) {
		out.push(t("acreditaciones.debutWith", { team: view.leagues[0]?.teamName ?? "su equipo" }));
		out.push(t("acreditaciones.matchesPlayedCount", { count: view.global.totalMatches }));
	}

	return out.slice(0, 4).map((l, i) => ({ l, n: String(i + 1).padStart(2, "0") }));
}

function isFemenilProfile(_view: PlayerView): boolean {
	return false; // si en el futuro guardas género en `players`, devuélvelo aquí.
	// Hoy las ligas tienen `category` (e.g. "Libre Femenil") pero está en cada liga,
	// y un jugador puede estar en varias. Mejor depender de un campo en `players`.
}

function splitHeadline(title: string): [string, string] {
	const words = title.split(" ");
	if (words.length === 1) return [words[0] + ".", ""];
	const half = Math.ceil(words.length / 2);
	return [words.slice(0, half).join(" "), words.slice(half).join(" ") + "."];
}

function buildDek(
	view: PlayerView,
	ego: PlayerEgoStats,
	achievement: Achievement | null,
	t: Translator,
) {
	const name = view.alias ? `"${view.alias}"` : view.fullName;
	const g = view.global;

	const goleadorLabels = [t("achievement.goleador.male"), t("achievement.goleador.female")];
	if (achievement && goleadorLabels.includes(achievement.short)) {
		const city = ego.positions.city?.cityName ?? "su ciudad";
		const total = ego.positions.city?.total ?? 0;
		return t.rich("dek.goleador", {
			name,
			city,
			total,
			goals: g.totalGoals,
			leagues: g.leaguesCount,
			strong: (chunks) => <strong className="text-ink font-bold">{chunks}</strong>,
		});
	}
	if (achievement?.short === "ARTILLERO") {
		return t.rich("dek.artillero", {
			name,
			gpm: g.goalsPerMatch.toFixed(2),
			matches: g.totalMatches,
			strong: (chunks) => <strong className="text-ink font-bold">{chunks}</strong>,
		});
	}
	if (achievement?.short === "MULTILIGAS") {
		return t.rich("dek.multiligas", {
			name,
			leagues: g.leaguesCount,
			contributions: g.totalGoals + g.totalAssists,
			strong: (chunks) => <strong className="text-ink font-bold">{chunks}</strong>,
		});
	}
	if (achievement?.short === "RACHA") {
		return t.rich("dek.racha", {
			name,
			streak: ego.goalStreak,
			strong: (chunks) => <strong className="text-ink font-bold">{chunks}</strong>,
		});
	}
	if (achievement?.short === "TITULAR") {
		return t.rich("dek.titular", {
			name,
			matches: g.totalMatches,
			strong: (chunks) => <strong className="text-ink font-bold">{chunks}</strong>,
		});
	}
	return t.rich("dek.default", {
		name,
		leagues: g.leaguesCount,
		matches: g.totalMatches,
		strong: (chunks) => <strong className="text-ink font-bold">{chunks}</strong>,
	});
}

function leagueShare(
	liga: PlayerLeagueStats,
	teamShares: PlayerEgoStats["teamGoalShares"],
): { pct: number; teamGoals: number; totalTeamGoals: number } {
	const share = teamShares.find((s) => s.leagueId === liga.leagueId);
	if (!share) return { pct: 0, teamGoals: liga.goals, totalTeamGoals: 0 };
	return {
		pct: share.sharePercent,
		teamGoals: share.playerGoals,
		totalTeamGoals: share.teamGoals,
	};
}

export default async function PlayerEditorialProfile({
	view,
	ego,
	shareUrl,
}: {
	view: PlayerView;
	ego: PlayerEgoStats;
	shareUrl?: string;
}) {
	const t = await getTranslations("player");
	const achievement = pickAchievement(view, ego, t);
	const hero = pickHero(view, t);
	const secondary = pickSecondaryStats(view, hero, t);
	const acreditaciones = pickAcreditaciones(view, ego, t);
	const dek = buildDek(view, ego, achievement, t);

	const [line1, line2] = splitHeadline(achievement?.title ?? view.fullName);

	const activeLigas = view.leagues.filter((l) => l.leagueStatus === "active");
	const city = ego.positions.city?.cityName ?? view.leagues[0]?.city ?? "—";
	const position = view.leagues[0]?.dayOfWeek ?? ""; // si no tienes posición, usa el día
	const metaLine = `VOL.26 / ${city.toUpperCase()} / ${position.slice(0, 3).toUpperCase() || "—"}`;
	const slug = `talacha.stats/${view.alias ?? view.id.slice(0, 8)}`;

	return (
		<article className="bg-pitch text-ink font-body">
			<div className="mx-auto max-w-lg w-full px-5 py-6">
				{/* Masthead */}
				<header className="flex justify-between items-center pb-3 border-b-2 border-brand">
					<span className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-brand-ink">
						TalachaStats
					</span>
					<span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
						{metaLine}
					</span>
				</header>

				{/* Eyebrow + Headline + Dek */}
				<section className="mt-5">
					<p className="font-body text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-ink">
						● {t(isFemenilProfile(view) ? "profileEyebrow.female" : "profileEyebrow.male")}
					</p>
					<h1 className="mt-3 font-display font-black text-5xl sm:text-6xl leading-[0.88] tracking-tight uppercase">
						{line1}
						{line2 && (
							<>
								<br />
								{line2}
							</>
						)}
					</h1>
					<p className="mt-3 text-sm text-ink-2 leading-snug">{dek}</p>
				</section>

				{/* Lead stat row */}
				<section className="mt-5 py-4 border-y border-line grid grid-cols-[1.4fr_1fr_1fr_1fr] items-end gap-2">
					<div>
						<p className="font-display font-black text-[88px] sm:text-[104px] leading-[0.8] tracking-[-0.04em] text-brand-ink">
							{hero.value}
						</p>
						<p className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
							{hero.label}
						</p>
					</div>
					{secondary.map((s) => (
						<div key={s.label}>
							<p className="font-display font-black text-3xl leading-none tracking-[-0.02em]">
								{s.value}
							</p>
							<p className="mt-1 font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
								{s.label}
							</p>
						</div>
					))}
				</section>

				{/* Acreditaciones */}
				{acreditaciones.length > 0 && (
					<section className="mt-5">
						<p className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-ink-3">
							{t("acreditaciones.title")}
						</p>
						<ul className="mt-2 flex flex-col">
							{acreditaciones.map((row, i) => (
								<li
									key={row.n}
									className={`grid grid-cols-[32px_1fr_auto] gap-2 items-center py-2 ${
										i === 0 ? "" : "border-t border-line"
									}`}
								>
									<span className="font-mono text-[10px] tracking-[0.16em] text-brand-ink">
										{row.n}
									</span>
									<span className="font-display font-bold text-lg tracking-tight">{row.l}</span>
									<span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_8px_var(--color-brand)]" />
								</li>
							))}
						</ul>
					</section>
				)}

				{/* En curso */}
				{activeLigas.length > 0 && (
					<section className="mt-4">
						<p className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-ink-3">
							{t("enCurso")}
						</p>
						<ul className="mt-2 flex flex-col gap-2">
							{activeLigas.map((l, i) => {
								const share = leagueShare(l, ego.teamGoalShares);
								return (
									<li
										key={l.leagueId}
										className={`grid grid-cols-[1fr_auto] gap-3 pb-3 ${
											i < activeLigas.length - 1 ? "border-b border-line" : ""
										}`}
									>
										<div className="min-w-0">
											<p className="font-display font-extrabold text-xl uppercase truncate">
												{l.leagueName}
											</p>
											<p className="mt-0.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink-3">
												{l.teamName} · {l.dayOfWeek} · {l.season}
											</p>
											{share.totalTeamGoals > 0 && (
												<div className="mt-2 max-w-[220px]">
													<div className="h-[3px] bg-line rounded-full overflow-hidden relative">
														<div
															className="absolute inset-y-0 left-0 bg-brand"
															style={{
																width: `${share.pct}%`,
																boxShadow: "0 0 12px var(--color-brand)",
															}}
														/>
													</div>
													<div className="mt-1 flex justify-between font-mono text-[10px] tracking-wide text-ink-2">
														<span>{t("teamGoalsShare", { pct: share.pct })}</span>
														<span>
															{share.teamGoals}/{share.totalTeamGoals}
														</span>
													</div>
												</div>
											)}
										</div>
										<div className="text-right">
											<p className="font-display font-black text-[42px] leading-[0.85] tracking-[-0.02em] text-brand-ink">
												{l.goals}
											</p>
											<p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
												{t("secondary.goals")}
											</p>
											{l.assists > 0 && (
												<p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-ink-2">
													+{l.assists} A
												</p>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					</section>
				)}
				<ShareFooter
					url={shareUrl ?? `https://www.talachastats.com/player/${view.id}`}
					slug={slug}
				/>
			</div>
		</article>
	);
}
