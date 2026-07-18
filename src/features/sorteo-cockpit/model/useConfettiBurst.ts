"use client";

/**
 * features/sorteo-cockpit/model/useConfettiBurst.ts
 *
 * Ráfaga de confeti disparada imperativamente (burst()) cada vez que un
 * sorteo se revela con éxito — a diferencia de
 * onboarding-wizard/useConfettiPieces (que genera una sola vez al montar
 * StepFinale), aquí el cockpit permanece montado entre sorteos repetidos, así
 * que necesita poder regenerar piezas nuevas en cada burst. Se duplica en vez
 * de importar el hook de onboarding-wizard por la regla FSD de no cruzar
 * features del mismo layer.
 */

import { useCallback, useState } from "react";

export type ConfettiPiece = {
	id: number;
	left: number;
	top: number;
	color: string;
	delay: number;
};

const CONFETTI_COLORS = ["#00e676", "#00c853", "#f5f5f5"];
const CONFETTI_COUNT = 24;

function buildPieces(seed: number): ConfettiPiece[] {
	return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
		id: seed * 1000 + i,
		left: 40 + Math.random() * 70,
		top: 6 + Math.random() * 4,
		color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
		delay: Math.random() * 250,
	}));
}

export function useConfettiBurst() {
	const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
	const [burstId, setBurstId] = useState(0);

	const burst = useCallback(() => {
		setBurstId((id) => {
			const next = id + 1;
			setPieces(buildPieces(next));
			return next;
		});
	}, []);

	return { pieces, burstId, burst };
}
