"use client";

/**
 * features/onboarding-wizard/model/useConfettiPieces.ts
 * Genera las piezas de confeti de StepFinale una sola vez por montaje
 * (useState con lazy initializer, no un efecto — §7.2). StepFinale solo
 * monta tras una transición de estado del cliente (nunca en SSR), así que
 * usar Math.random() aquí no puede causar un hydration mismatch.
 */

import { useState } from "react";

export type ConfettiPiece = {
	id: number;
	left: number;
	color: string;
	duration: number;
	delay: number;
	rotate: number;
	size: number;
};

const CONFETTI_COLORS = ["#00e676", "#fbbf24", "#ffffff", "#00c853"];
const CONFETTI_COUNT = 60;

function buildConfettiPieces(): ConfettiPiece[] {
	return Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
		id,
		left: Math.random() * 100,
		color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
		duration: 2.4 + Math.random() * 2,
		delay: Math.random() * 0.6,
		rotate: Math.random() * 360,
		size: 6 + Math.random() * 5,
	}));
}

export function useConfettiPieces(): ConfettiPiece[] {
	const [pieces] = useState(buildConfettiPieces);
	return pieces;
}
