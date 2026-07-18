"use client";

/**
 * features/sorteo-cockpit/ui/ShuffleOverlay.tsx
 *
 * Se muestra en vez de la tabla mientras `sortear`/`regenerar` está en vuelo.
 * El contador es cosmético (no refleja progreso real del servidor, que es
 * una sola llamada atómica) — solo comunica actividad mientras se espera la
 * respuesta, como en el mockup "Sorteo Cockpit - Flujo Mejorado".
 */

import { useEffect, useState } from "react";

type ShuffleOverlayProps = {
	total: number;
};

const TICK_MS = 220;

export function ShuffleOverlay({ total }: ShuffleOverlayProps) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (total <= 0) return;
		const id = setInterval(() => {
			setCount((c) => (c < total - 1 ? c + 1 : c));
		}, TICK_MS);
		return () => clearInterval(id);
	}, [total]);

	const pct = total > 0 ? Math.round((count / total) * 100) : 0;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 22,
				padding: 40,
				height: "100%",
			}}
		>
			<div className="shuffle-ring" />
			<div
				style={{
					fontFamily: "var(--font-display)",
					fontSize: 22,
					fontWeight: 800,
					color: "var(--color-ink)",
				}}
			>
				Generando la jornada…
			</div>
			{total > 0 && (
				<div
					style={{ fontSize: 13, color: "var(--color-ink-3)", fontVariantNumeric: "tabular-nums" }}
				>
					Emparejando equipos — {count} / {total}
				</div>
			)}
			<div
				style={{
					width: 220,
					height: 4,
					borderRadius: 99,
					background: "var(--color-surface-2)",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						height: "100%",
						width: `${pct}%`,
						background: "linear-gradient(90deg, var(--color-brand-dim), var(--color-brand))",
						borderRadius: 99,
						transition: "width 0.28s ease",
					}}
				/>
			</div>
		</div>
	);
}
