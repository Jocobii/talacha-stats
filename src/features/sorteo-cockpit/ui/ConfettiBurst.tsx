"use client";

/**
 * features/sorteo-cockpit/ui/ConfettiBurst.tsx
 * Overlay decorativo, contenido dentro del panel de sorteo (no full-screen
 * como StepFinale). Ver useConfettiBurst para cómo se generan las piezas.
 */

import type { ConfettiPiece } from "../model/useConfettiBurst";

type ConfettiBurstProps = {
	pieces: ConfettiPiece[];
	burstId: number;
};

export function ConfettiBurst({ pieces, burstId }: ConfettiBurstProps) {
	if (pieces.length === 0) return null;

	return (
		<div
			key={burstId}
			style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
			aria-hidden
		>
			{pieces.map((p) => (
				<span
					key={p.id}
					className="animate-sorteo-confetti"
					style={{
						position: "absolute",
						left: `${p.left}%`,
						top: p.top,
						width: 8,
						height: 8,
						borderRadius: 2,
						background: p.color,
						animationDelay: `${p.delay}ms`,
					}}
				/>
			))}
		</div>
	);
}
