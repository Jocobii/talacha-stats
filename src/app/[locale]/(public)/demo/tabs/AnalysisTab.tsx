"use client";

import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import { ANALYSIS } from "../mock";
import { TeamCard, RosterTable, DangerBadge } from "./analysis-parts";

export function AnalysisTab() {
	const t = useTranslations("demo");
	const {
		teamA: a,
		teamB: b,
		prob,
		h2h,
		prediction: pred,
		simulator: sim,
		bullets,
		funFacts,
	} = ANALYSIS;

	return (
		<div className="flex flex-col flex-1">
			<div className="bg-pitch px-5 pt-8 pb-6 max-w-2xl mx-auto w-full">
				<div className="flex items-center gap-2 mb-1">
					<BarChart3 size={24} className="text-brand-ink" strokeWidth={2} />
					<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
						{t("analysis.title")}
					</h1>
				</div>
				<p className="text-ink-2 text-sm mt-0.5">
					{t("analysis.subtitle", { jornada: ANALYSIS.league.jornada })}
				</p>
			</div>

			<div className="bg-surface flex-1 rounded-t-3xl px-4 pt-6 pb-16">
				<div className="max-w-2xl mx-auto space-y-4">
					{/* VS header */}
					<div className="bg-pitch border border-line rounded-2xl p-5 text-center">
						<p className="text-xs text-ink-3 uppercase tracking-widest mb-3">
							{ANALYSIS.league.name} · {ANALYSIS.league.season}
						</p>
						<div className="flex items-center justify-center gap-3">
							<div className="text-right flex-1 min-w-0">
								<p className="text-base sm:text-xl font-display font-black text-blue leading-tight">
									{a.name}
								</p>
								<p className="text-xs text-ink-3 mt-0.5">{a.position}° en tabla</p>
							</div>
							<div className="font-display font-black text-xl text-ink-3 shrink-0 px-1">VS</div>
							<div className="text-left flex-1 min-w-0">
								<p className="text-base sm:text-xl font-display font-black text-rose leading-tight">
									{b.name}
								</p>
								<p className="text-xs text-ink-3 mt-0.5">{b.position}° en tabla</p>
							</div>
						</div>
					</div>

					{/* Win probability */}
					<div className="bg-surface-2 border border-line rounded-2xl p-5">
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">
							{t("analysis.winProbability")}
						</h2>
						<div className="flex rounded-full overflow-hidden h-9 text-xs font-bold">
							<div
								className="flex items-center justify-center bg-blue text-pitch"
								style={{ width: `${prob.a}%` }}
							>
								{prob.a}%
							</div>
							<div
								className="flex items-center justify-center bg-surface text-ink-3"
								style={{ width: `${prob.draw}%` }}
							>
								{prob.draw}%
							</div>
							<div
								className="flex items-center justify-center bg-rose text-pitch"
								style={{ width: `${prob.b}%` }}
							>
								{prob.b}%
							</div>
						</div>
						<div className="flex justify-between text-xs mt-2 px-0.5">
							<span className="text-blue font-semibold">{a.name}</span>
							<span className="text-ink-3">{t("analysis.draw")}</span>
							<span className="text-rose font-semibold">{b.name}</span>
						</div>
					</div>

					{/* Team cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<TeamCard team={a} />
						<TeamCard team={b} />
					</div>

					{/* Prediction */}
					<div className="bg-surface-2 border border-line rounded-2xl p-5 space-y-5">
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink">
							{t("analysis.prediction")}
						</h2>
						<div className="text-center">
							<p className="text-xs text-ink-3 uppercase tracking-widest mb-2">
								{t("analysis.mostLikelyScore")}
							</p>
							<div className="flex items-center justify-center gap-4">
								<div className="text-right">
									<p className="font-display font-black text-5xl text-blue">{pred.scoreA}</p>
									<p className="text-xs text-ink-3 mt-0.5">{a.name}</p>
								</div>
								<span className="font-display font-black text-3xl text-line">–</span>
								<div className="text-left">
									<p className="font-display font-black text-5xl text-rose">{pred.scoreB}</p>
									<p className="text-xs text-ink-3 mt-0.5">{b.name}</p>
								</div>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-3 text-center">
							<div className="bg-blue/10 border border-blue/20 rounded-xl p-3">
								<p className="font-display font-black text-3xl text-blue">{pred.expA}</p>
								<p className="text-[10px] text-ink-3 mt-0.5">{t("analysis.expectedGoals")}</p>
							</div>
							<div className="bg-pitch border border-line rounded-xl p-3 flex flex-col items-center justify-center gap-1">
								<p className="font-display font-black text-2xl text-ink">{pred.total}</p>
								<p className="text-[10px] text-ink-3">{t("analysis.total")}</p>
								<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/25">
									{t("analysis.openMatch")}
								</span>
							</div>
							<div className="bg-rose/10 border border-rose/20 rounded-xl p-3">
								<p className="font-display font-black text-3xl text-rose">{pred.expB}</p>
								<p className="text-[10px] text-ink-3 mt-0.5">{t("analysis.expectedGoals")}</p>
							</div>
						</div>
					</div>

					{/* Position simulator */}
					<div className="bg-surface-2 border border-line rounded-2xl p-5">
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">
							{t("analysis.positionSimulator")}
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{[
								{ name: a.name, s: sim.a, color: "blue" as const },
								{ name: b.name, s: sim.b, color: "rose" as const },
							].map(({ name, s, color }) => (
								<div
									key={name}
									className={`rounded-xl border p-4 ${color === "blue" ? "bg-blue/10 border-blue/20" : "bg-rose/10 border-rose/20"}`}
								>
									<p
										className={`font-display font-black text-lg uppercase mb-1 ${color === "blue" ? "text-blue" : "text-rose"}`}
									>
										{name}
									</p>
									<p className="text-xs text-ink-3 mb-3">
										{t("analysis.position")} <strong className="text-ink">{s.pos}°</strong> ·{" "}
										{s.pts} {t("analysis.pts")}
									</p>
									<div className="space-y-1.5 text-sm">
										{[
											{ label: t("analysis.ifWin"), to: s.win, from: s.pos },
											{ label: t("analysis.ifDraw"), to: s.draw, from: s.pos },
											{ label: t("analysis.ifLoss"), to: s.loss, from: s.pos },
										].map(({ label, to, from }) => {
											const delta = from - to;
											return (
												<div key={label} className="flex justify-between items-center">
													<span className="text-ink-3">{label}</span>
													{delta > 0 ? (
														<span className="text-brand-ink font-bold">
															{to}° ↑{delta}
														</span>
													) : delta < 0 ? (
														<span className="text-rose font-bold">
															{to}° ↓{Math.abs(delta)}
														</span>
													) : (
														<span className="text-ink-2 font-bold">{to}° =</span>
													)}
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Scoring threats */}
					<div className="bg-surface-2 border border-line rounded-2xl p-5">
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">
							{t("analysis.scoringThreats")}
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{[
								{ team: a, color: "blue" as const },
								{ team: b, color: "rose" as const },
							].map(({ team, color }) => (
								<div key={team.name}>
									<p
										className={`text-xs font-bold uppercase tracking-widest mb-3 ${color === "blue" ? "text-blue" : "text-rose"}`}
									>
										{team.name}
									</p>
									<div className="space-y-2">
										{team.threats.map((tr, i) => (
											<div key={tr.name} className="flex items-center gap-3">
												<span
													className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-pitch shrink-0
                          ${i === 0 ? (color === "blue" ? "bg-blue" : "bg-rose") : "bg-surface border border-line text-ink-3"}`}
												>
													{i + 1}
												</span>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-ink truncate">{tr.name}</p>
													<p className="text-xs text-ink-3">
														{t("analysis.goalsPerMatchInline", { goals: tr.goals, gpm: tr.gpm })}
													</p>
												</div>
												<DangerBadge rating={tr.danger} />
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Narrator */}
					<section className="bg-surface-2 border border-line rounded-2xl p-5">
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">
							{t("analysis.narratorScript")}
						</h2>
						<ul className="space-y-2">
							{bullets.map((bl, i) => (
								<li
									key={i}
									className="text-sm text-ink-2 bg-pitch border border-line rounded-xl px-4 py-2.5"
								>
									{bl}
								</li>
							))}
						</ul>
					</section>

					{/* Fun facts */}
					<section className="bg-surface-2 border border-line rounded-2xl p-5">
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-3">
							{t("analysis.funFacts")}
						</h2>
						<ul className="space-y-2">
							{funFacts.map((f, i) => (
								<li key={i} className="text-sm text-ink-2 flex gap-2">
									<span className="text-brand-ink shrink-0">★</span>
									{f}
								</li>
							))}
						</ul>
					</section>

					{/* H2H */}
					<div className="bg-surface-2 border border-line rounded-2xl p-5">
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink mb-4">
							{t("analysis.headToHead")}
						</h2>
						<div className="flex items-center justify-center gap-6">
							<div className="text-center flex-1">
								<p className="font-display font-black text-5xl text-blue">{h2h.aWins}</p>
								<p className="text-xs text-ink-3 mt-1">{a.name}</p>
							</div>
							<div className="text-center">
								<p className="font-display font-black text-4xl text-ink-3">{h2h.draws}</p>
								<p className="text-xs text-ink-3">{t("analysis.draws")}</p>
							</div>
							<div className="text-center flex-1">
								<p className="font-display font-black text-5xl text-rose">{h2h.bWins}</p>
								<p className="text-xs text-ink-3 mt-1">{b.name}</p>
							</div>
						</div>
						<p className="text-center text-xs text-ink-3 mt-4 border-t border-line pt-3">
							{t("analysis.last")}{" "}
							<strong className="text-ink">
								{h2h.last.a}–{h2h.last.b}
							</strong>{" "}
							· Azteca ganó
						</p>
					</div>

					{/* Rosters */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<RosterTable team={a} color="blue" />
						<RosterTable team={b} color="rose" />
					</div>
				</div>
			</div>
		</div>
	);
}
