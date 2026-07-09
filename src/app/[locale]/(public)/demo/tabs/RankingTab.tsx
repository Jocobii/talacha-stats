"use client";

import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { RANKING, initial } from "../mock";

export function RankingTab({ onShowProfile }: { onShowProfile: () => void }) {
	const t = useTranslations("demo");
	const top3 = RANKING.slice(0, 3);
	const rest = RANKING.slice(3);

	const podium = [
		{ ...top3[1], pos: 2, medal: "🥈", size: "text-3xl", mt: "mt-6" },
		{ ...top3[0], pos: 1, medal: "🥇", size: "text-5xl", mt: "" },
		{ ...top3[2], pos: 3, medal: "🥉", size: "text-3xl", mt: "mt-6" },
	];

	return (
		<div className="flex flex-col flex-1">
			<div className="bg-pitch px-5 pt-8 pb-6 max-w-lg mx-auto w-full">
				<div className="flex items-center gap-2 mb-1">
					<Trophy size={24} className="text-brand-ink" strokeWidth={2} />
					<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
						{t("ranking.title")}
					</h1>
				</div>
				<p className="text-ink-2 text-sm">{t("ranking.subtitle", { count: RANKING.length })}</p>
			</div>

			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-10">
				<div className="max-w-lg mx-auto space-y-3">
					{/* Podium */}
					<div className="grid grid-cols-3 gap-2 mb-2">
						{podium.map((p) => (
							<button
								key={p.id}
								onClick={p.pos === 1 ? onShowProfile : undefined}
								className={`bg-surface-2 border border-line rounded-2xl flex flex-col items-center text-center px-2 py-4 ${p.mt}
                  ${p.pos === 1 ? "hover:border-brand cursor-pointer transition" : "cursor-default"}`}
							>
								<span className="text-xl mb-2">{p.medal}</span>
								<div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-xl mb-2">
									{initial(p.fullName, p.alias)}
								</div>
								<p className="text-xs font-semibold text-ink leading-tight line-clamp-2 w-full">
									{p.alias ? `"${p.alias}"` : p.fullName}
								</p>
								<p className={`${p.size} font-display font-black text-brand-ink mt-1 leading-none`}>
									{p.goals}
								</p>
								<p className="text-[10px] text-ink-3">{t("ranking.goals")}</p>
								<p className="text-[10px] text-ink-3 mt-0.5">
									{(p.goals / p.matches).toFixed(2)}/PJ
								</p>
							</button>
						))}
					</div>

					{rest.map((p, i) => (
						<div
							key={p.id}
							className={`flex items-center gap-4 bg-surface-2 border border-line rounded-2xl px-4 py-3.5
                ${p.id === "1" ? "hover:border-brand cursor-pointer transition" : ""}`}
							onClick={p.id === "1" ? onShowProfile : undefined}
						>
							<div className="w-8 text-center shrink-0 font-display font-black text-xl text-ink-3">
								{i + 4}
							</div>
							<div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-base shrink-0">
								{initial(p.fullName, p.alias)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-semibold text-ink truncate text-sm">
									{p.alias ? `"${p.alias}"` : p.fullName}
								</p>
								<p className="text-xs text-ink-2 truncate">
									{p.team} · {p.league.name}
									{p.leagues > 1 && (
										<span className="ml-1 text-brand-ink font-medium">+{p.leagues - 1} liga</span>
									)}
								</p>
							</div>
							<div className="text-right shrink-0">
								<p className="font-display font-black text-2xl text-brand-ink leading-none">
									{p.goals}
								</p>
								<p className="text-[10px] text-ink-3">{(p.goals / p.matches).toFixed(2)}/PJ</p>
							</div>
						</div>
					))}

					<p className="text-center text-xs text-ink-3 pt-2">{t("ranking.tapHint")}</p>
				</div>
			</div>
		</div>
	);
}
