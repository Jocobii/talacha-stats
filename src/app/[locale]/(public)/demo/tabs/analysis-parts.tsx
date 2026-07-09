"use client";

import { useTranslations } from "next-intl";
import type { TeamData } from "../mock";

export function DangerBadge({ rating }: { rating: string }) {
	const t = useTranslations("demo");
	const labels: Record<string, string> = {
		ALTO: t("danger.high"),
		MEDIO: t("danger.medium"),
		BAJO: t("danger.low"),
	};
	const styles: Record<string, string> = {
		ALTO: "bg-rose/10 text-rose border-rose/25",
		MEDIO: "bg-amber/10 text-amber border-amber/25",
		BAJO: "bg-surface text-ink-3 border-line",
	};
	return (
		<span
			className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${styles[rating] ?? styles.BAJO}`}
		>
			{labels[rating] ?? rating}
		</span>
	);
}

export function TeamCard({ team }: { team: TeamData }) {
	const t = useTranslations("demo");
	const isBlue = team.color === "blue";
	const accent = isBlue ? "text-blue" : "text-rose";
	const topBorder = isBlue ? "border-t-blue" : "border-t-rose";
	const statBg = isBlue ? "bg-blue/10 border-blue/20" : "bg-rose/10 border-rose/20";
	const statVal = isBlue ? "text-blue" : "text-rose";

	const resultColor = (r: "W" | "D" | "L") =>
		r === "W"
			? "bg-brand text-pitch"
			: r === "D"
				? "bg-surface border border-line text-ink-2"
				: "bg-rose text-pitch";

	return (
		<div className={`bg-surface-2 border border-line border-t-2 ${topBorder} rounded-2xl p-5`}>
			<h3 className={`font-display font-black text-2xl ${accent} mb-3 uppercase tracking-wide`}>
				{team.name}
			</h3>

			<div className="grid grid-cols-4 gap-2 mb-3">
				{[
					{ label: "PTS", value: team.points },
					{ label: "G", value: team.record.w },
					{ label: "E", value: team.record.d },
					{ label: "P", value: team.record.l },
				].map((s) => (
					<div key={s.label} className={`${statBg} border rounded-lg p-2 text-center`}>
						<p className={`text-xl font-display font-black ${statVal}`}>{s.value}</p>
						<p className="text-[10px] text-ink-3 uppercase">{s.label}</p>
					</div>
				))}
			</div>

			<div className="flex gap-3 mb-3 text-sm flex-wrap">
				<span className="text-ink-3">
					GF <strong className="text-ink">{team.gf}</strong>
				</span>
				<span className="text-line">|</span>
				<span className="text-ink-3">
					GC <strong className="text-ink">{team.gc}</strong>
				</span>
				<span className="text-line">|</span>
				<span className="text-ink-3">
					Dif{" "}
					<strong className={team.diff >= 0 ? "text-brand-ink" : "text-rose"}>+{team.diff}</strong>
				</span>
				<span className="text-line">|</span>
				<span className="text-ink-3">
					Prom <strong className="text-ink">{team.avg}</strong>
				</span>
			</div>

			<div className="flex gap-1 mb-3">
				<span className="text-xs text-ink-3 mr-1 self-center">{t("team.last5")}</span>
				{team.last5.map((r, i) => (
					<span
						key={i}
						className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${resultColor(r)}`}
					>
						{r === "W" ? "G" : r === "D" ? "E" : "P"}
					</span>
				))}
			</div>

			<div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3 bg-brand/10 text-brand-ink border border-brand/25">
				{team.streak.type === "W"
					? t("team.streakWins", { count: team.streak.count })
					: t("team.streakDraws", { count: team.streak.count })}
			</div>

			<div className="flex gap-2 mb-3 flex-wrap">
				<span
					className={`text-xs px-2 py-0.5 rounded-full font-medium border
          ${team.attackRank <= 2 ? "bg-brand/10 text-brand-ink border-brand/25" : "bg-amber/10 text-amber border-amber/25"}`}
				>
					⚔️ {team.attackRank <= 2 ? t("team.strongAttack") : t("team.averageAttack")} (
					{team.attackRank}/{team.totalTeams})
				</span>
				<span
					className={`text-xs px-2 py-0.5 rounded-full font-medium border
          ${team.defenseRank <= 2 ? "bg-brand/10 text-brand-ink border-brand/25" : "bg-amber/10 text-amber border-amber/25"}`}
				>
					🛡️ {team.defenseRank <= 2 ? t("team.solidDefense") : t("team.averageDefense")} (
					{team.defenseRank}/{team.totalTeams})
				</span>
			</div>

			<div className="space-y-1.5 border-t border-line pt-3">
				<div className="flex items-center gap-2 text-sm">
					<span className="text-brand-ink">⚽</span>
					<span className="text-ink-2">{team.topScorer.name}</span>
					<span className="ml-auto text-ink-3">{team.topScorer.goals} goles</span>
				</div>
				{team.cardRisk.map((r) => (
					<div key={r.player} className="flex items-center gap-2 text-sm">
						<span>🟨</span>
						<span className="text-ink-2">{r.player}</span>
						<span className="ml-auto text-xs text-amber">{r.note}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function RosterTable({ team, color }: { team: TeamData; color: "blue" | "rose" }) {
	const t = useTranslations("demo");
	const accent = color === "blue" ? "text-blue border-t-blue" : "text-rose border-t-rose";
	return (
		<div
			className={`bg-surface-2 border border-line border-t-2 ${accent} rounded-2xl overflow-hidden`}
		>
			<div className="px-4 py-3 border-b border-line">
				<h3
					className={`font-display font-black text-lg uppercase tracking-wide ${color === "blue" ? "text-blue" : "text-rose"}`}
				>
					{team.name}
				</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead className="bg-pitch text-ink-3 uppercase">
						<tr>
							<th className="px-3 py-2 text-left font-semibold tracking-wide">
								{t("roster.player")}
							</th>
							<th className="px-2 py-2 text-center">⚽</th>
							<th className="px-2 py-2 text-center">🟨</th>
							<th className="px-2 py-2 text-center">🟥</th>
							<th className="px-2 py-2 text-center">PJ</th>
							<th className="px-2 py-2 text-center">{t("roster.danger")}</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-line">
						{team.roster.map((p) => (
							<tr
								key={p.name}
								className={`hover:bg-pitch transition ${p.goals === 0 ? "opacity-40" : ""}`}
							>
								<td className="px-3 py-2 font-medium text-ink max-w-[130px] truncate">{p.name}</td>
								<td className="px-2 py-2 text-center font-bold text-brand-ink">{p.goals || "—"}</td>
								<td className="px-2 py-2 text-center text-amber">{p.yellows || "—"}</td>
								<td className="px-2 py-2 text-center text-rose">{p.reds || "—"}</td>
								<td className="px-2 py-2 text-center text-ink-3">{p.pj}</td>
								<td className="px-2 py-2 text-center">
									<DangerBadge rating={p.danger} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
