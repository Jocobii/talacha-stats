"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { MATCHDAY, initial } from "../mock";

export function MatchdayTab() {
	const t = useTranslations("demo");
	const medals = ["🥇", "🥈", "🥉"];
	return (
		<div className="flex flex-col flex-1">
			<div className="bg-pitch px-5 pt-8 pb-6 max-w-lg mx-auto w-full">
				<div className="flex items-center gap-2 mb-1">
					<Star size={24} className="text-brand-ink" strokeWidth={2} />
					<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
						{t("matchday.title")}
					</h1>
				</div>
				<p className="text-ink-2 text-sm mt-0.5">{t("matchday.subtitle")}</p>
			</div>

			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-10">
				<div className="max-w-lg mx-auto space-y-4">
					{MATCHDAY.map((league) => (
						<div
							key={league.league.name}
							className="bg-surface-2 border border-line rounded-2xl overflow-hidden"
						>
							<div className="h-1 bg-brand" />
							<div className="px-4 pt-4 pb-5 space-y-4">
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-display font-black text-xl uppercase tracking-wide text-ink leading-tight">
											{league.league.name}
										</p>
										<p className="text-xs text-ink-2 capitalize mt-0.5">
											{league.league.day} · {league.league.season}
										</p>
									</div>
									<div className="bg-surface border border-line rounded-xl px-3 py-1.5 text-center shrink-0">
										<p className="font-display font-black text-lg text-brand-ink leading-none">
											J{league.jornada}
										</p>
										<p className="text-[9px] text-ink-3 uppercase tracking-wide">jornada</p>
									</div>
								</div>
								<div className="space-y-2">
									{league.heroes.map((hero, i) => (
										<div
											key={hero.id}
											className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border
                        ${i === 0 ? "bg-pitch border-brand/30" : "bg-surface border-line"}`}
										>
											<span className="text-xl shrink-0">{medals[i]}</span>
											<div
												className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0
                        ${i === 0 ? "bg-brand text-pitch" : "bg-surface-2 text-ink-2"}`}
											>
												{initial(hero.fullName, hero.alias)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-semibold text-ink text-sm truncate">
													{hero.alias ? `"${hero.alias}"` : hero.fullName}
												</p>
												<p className="text-xs text-ink-2 truncate">{hero.team}</p>
											</div>
											<div className="text-right shrink-0">
												<p
													className={`font-display font-black text-2xl leading-none ${i === 0 ? "text-brand-ink" : "text-ink"}`}
												>
													{hero.goals}
												</p>
												<p className="text-[10px] text-ink-3">{hero.gpm.toFixed(1)}/PJ</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
