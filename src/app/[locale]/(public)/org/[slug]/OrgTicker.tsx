import type { TickerItem } from "@/features/org-hub";

type Props = { items: TickerItem[] };

/**
 * Ticker horizontal estilo ESPN.
 * Duplica los items para que el loop sea continuo y sin saltos.
 * El hover pausa la animación vía CSS (.animate-ticker-wrap:hover .animate-ticker).
 * No necesita "use client" — la interacción es CSS puro.
 */
export default function OrgTicker({ items }: Props) {
	if (items.length === 0) return null;

	return (
		<div
			className="animate-ticker-wrap overflow-hidden border-y border-line bg-surface-2 py-2"
			aria-label="Datos en vivo de las ligas"
		>
			{/* Dos copias → loop seamless cuando la primera termina su recorrido */}
			<div className="animate-ticker flex whitespace-nowrap">
				{[...items, ...items].map((item, i) => (
					<TickerChip key={`${item.id}-${i}`} item={item} />
				))}
			</div>
		</div>
	);
}

function TickerChip({ item }: { item: TickerItem }) {
	return (
		<span className="inline-flex items-center gap-2 px-5 border-r border-line text-xs shrink-0">
			<span className="text-ink-3 font-medium">{item.label}</span>
			<span className="text-brand-ink font-bold">{item.value}</span>
		</span>
	);
}
