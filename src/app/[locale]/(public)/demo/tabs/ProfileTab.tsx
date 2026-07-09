"use client";

import { useTranslations } from "next-intl";
import { DEMO_PLAYER } from "../mock";

export function ProfileTab() {
	const t = useTranslations("player");
	const p = DEMO_PLAYER;
	const name = `"${p.alias}"`;

	const secondary = [
		{ value: p.global.gpm.toFixed(2), label: t("secondary.goalsPerMatch") },
		{ value: p.global.matches, label: t("secondary.matches") },
		{ value: p.global.leagues, label: t("secondary.leagues") },
	];

	const acreditaciones = [
		t("acreditaciones.leagueScorer"),
		t("acreditaciones.activeInLeagues", { count: p.global.leagues }),
		t("acreditaciones.hatTrick"),
		t("acreditaciones.averageGoal"),
	].map((l, i) => ({ l, n: String(i + 1).padStart(2, "0") }));

	return (
		<div className="relative overflow-hidden bg-pitch flex-1">
			{/* Capa decorativa — glow verde + línea de cancha */}
			<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
				<div
					style={{
						position: "absolute",
						top: "-12%",
						right: "-10%",
						width: "62%",
						height: "62%",
						background:
							"radial-gradient(ellipse at 70% 25%, rgba(0,230,118,0.18) 0%, rgba(0,230,118,0.06) 45%, transparent 70%)",
					}}
				/>
				<svg
					className="absolute inset-0 w-full h-full"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="xMidYMid slice"
				>
					<circle
						cx="90%"
						cy="9%"
						r="20%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.1"
					/>
					<circle cx="90%" cy="9%" r="0.6%" fill="#00E676" opacity="0.22" />
				</svg>
			</div>

			<article className="relative mx-auto max-w-lg w-full px-5 pt-8 pb-14 font-body text-ink">
				{/* Avatar + nombre */}
				<div className="flex items-start gap-4 mb-6">
					<div className="w-14 h-14 rounded-xl bg-brand flex items-center justify-center text-2xl font-display font-black text-pitch shrink-0">
						{p.alias.charAt(0)}
					</div>
					<div className="flex-1 pt-1">
						<h2 className="font-display font-black text-2xl text-ink leading-tight uppercase">
							{p.fullName}
						</h2>
						<p className="text-brand-ink text-sm font-semibold mt-1">&quot;{p.alias}&quot;</p>
					</div>
				</div>

				{/* Masthead */}
				<header className="flex justify-between items-center pb-3 border-b-2 border-brand">
					<span className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-brand-ink">
						TalachaStats
					</span>
					<span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
						VOL.26 / TIJUANA / JUE
					</span>
				</header>

				{/* Eyebrow + Headline + Dek */}
				<section className="mt-5">
					<p className="font-body text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-ink">
						● {t("profileEyebrow.male")}
					</p>
					<h1 className="mt-3 font-display font-black text-5xl sm:text-6xl leading-[0.88] tracking-tight uppercase">
						Roberto
						<br />
						Mendoza.
					</h1>
					<p className="mt-3 text-sm text-ink-2 leading-snug">
						{t.rich("dek.multiligas", {
							name,
							leagues: p.global.leagues,
							contributions: p.global.goals,
							strong: (chunks) => <strong className="text-ink font-bold">{chunks}</strong>,
						})}
					</p>
				</section>

				{/* Lead stat row */}
				<section className="mt-5 py-4 border-y border-line grid grid-cols-[1.4fr_1fr_1fr_1fr] items-end gap-2">
					<div>
						<p className="font-display font-black text-[88px] sm:text-[104px] leading-[0.8] tracking-[-0.04em] text-brand-ink">
							{p.global.goals}
						</p>
						<p className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
							{t("hero.totalGoals")}
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
				<section className="mt-5">
					<p className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-ink-3">
						{t("acreditaciones.title")}
					</p>
					<ul className="mt-2 flex flex-col">
						{acreditaciones.map((row, i) => (
							<li
								key={row.n}
								className={`grid grid-cols-[32px_1fr_auto] gap-2 items-center py-2 ${i === 0 ? "" : "border-t border-line"}`}
							>
								<span className="font-mono text-[10px] tracking-[0.16em] text-brand-ink">
									{row.n}
								</span>
								<span className="font-display font-bold text-lg tracking-tight">{row.l}</span>
								<span
									className="w-2 h-2 rounded-full bg-brand"
									style={{ boxShadow: "0 0 8px var(--color-brand)" }}
								/>
							</li>
						))}
					</ul>
				</section>

				{/* En curso */}
				<section className="mt-4">
					<p className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-ink-3">
						{t("enCurso")}
					</p>
					<ul className="mt-2 flex flex-col gap-2">
						{p.leagues.map((l, i) => {
							const pct = Math.round((l.goals / l.teamGoals) * 100);
							return (
								<li
									key={l.name}
									className={`grid grid-cols-[1fr_auto] gap-3 pb-3 ${i < p.leagues.length - 1 ? "border-b border-line" : ""}`}
								>
									<div className="min-w-0">
										<p className="font-display font-extrabold text-xl uppercase truncate">
											{l.name}
										</p>
										<p className="mt-0.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink-3">
											{l.team} · {l.day} · {l.season}
										</p>
										<div className="mt-2 max-w-[220px]">
											<div className="h-[3px] bg-line rounded-full overflow-hidden relative">
												<div
													className="absolute inset-y-0 left-0 bg-brand"
													style={{ width: `${pct}%`, boxShadow: "0 0 12px var(--color-brand)" }}
												/>
											</div>
											<div className="mt-1 flex justify-between font-mono text-[10px] tracking-wide text-ink-2">
												<span>{t("teamGoalsShare", { pct })}</span>
												<span>
													{l.goals}/{l.teamGoals}
												</span>
											</div>
										</div>
									</div>
									<div className="text-right">
										<p className="font-display font-black text-[42px] leading-[0.85] tracking-[-0.02em] text-brand-ink">
											{l.goals}
										</p>
										<p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
											{t("secondary.goals")}
										</p>
									</div>
								</li>
							);
						})}
					</ul>
				</section>

				{/* Footer compartir (estático en el demo) */}
				<footer className="mt-5 border-t border-line">
					<div className="pt-3 flex justify-between items-center gap-2">
						<span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3 shrink-0">
							{t("shareFooter.tagline")}
						</span>
						<span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3 truncate max-w-[160px]">
							talacha.stats/el-toro
						</span>
					</div>
					<button className="mt-3 w-full flex items-center justify-center gap-2.5 py-3 border border-line text-ink-2 hover:border-brand hover:text-brand-ink transition-colors">
						<svg
							width="11"
							height="11"
							viewBox="0 0 11 11"
							fill="none"
							aria-hidden
							className="shrink-0"
						>
							<path
								d="M5.5 10V1.5M1.5 5.5L5.5 1.5 9.5 5.5"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						<span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold">
							{t("shareFooter.share")}
						</span>
					</button>
				</footer>
			</article>
		</div>
	);
}
