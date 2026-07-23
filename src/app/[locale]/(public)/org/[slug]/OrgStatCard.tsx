/**
 * OrgStatCard.tsx — tarjeta de una métrica del home (goles, equipos, jornada).
 * Presentacional. `accent` pinta el valor con el color de marca de la org.
 */

type Props = {
	value: string | number;
	label: string;
	accent?: boolean;
};

export default function OrgStatCard({ value, label, accent = false }: Props) {
	return (
		<div className="flex-1 min-w-[120px] bg-surface border border-line rounded-xl px-5 py-4">
			<div
				className={`font-display font-black text-3xl tracking-tight ${
					accent ? "text-brand-ink" : "text-ink"
				}`}
			>
				{value}
			</div>
			<div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3 mt-0.5">
				{label}
			</div>
		</div>
	);
}
