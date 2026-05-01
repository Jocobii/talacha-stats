import type { OrgHubStats } from "@/entities/organization";

type Props = {
	stats: OrgHubStats;
	totalTeams: number;
};

/**
 * Grid de 3 métricas: goles totales, equipos activos, última jornada.
 * Tres números dan densidad visual al header sin agregar complejidad.
 */
export default function OrgStatsStrip({ stats, totalTeams }: Props) {
	if (stats.totalGoals === 0 && totalTeams === 0) return null;

	return (
		<div className="grid grid-cols-3 gap-2 mt-5">
			<StatBox value={stats.totalGoals} label="Goles" highlight />
			<StatBox value={totalTeams} label="Equipos" />
			<StatBox value={stats.lastJornada ? `J${stats.lastJornada}` : "—"} label="Jornada" />
		</div>
	);
}

function StatBox({
	value,
	label,
	highlight = false,
}: {
	value: number | string;
	label: string;
	highlight?: boolean;
}) {
	return (
		<div className="bg-surface-2 border border-line rounded-2xl flex flex-col items-center justify-center py-3 gap-0.5">
			<span
				className={`font-display font-black text-2xl leading-none ${
					highlight ? "text-brand" : "text-ink"
				}`}
			>
				{value}
			</span>
			<span className="text-[10px] font-bold text-ink-3 uppercase tracking-widest">{label}</span>
		</div>
	);
}
