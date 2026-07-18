"use client";

/**
 * features/sorteo-cockpit/model/useSorteoRevealEffects.ts
 *
 * Coordina las animaciones de "reveal" del panel de sorteo: detecta la
 * transición loading=true → loading=false (fin de un sortear/regenerar
 * exitoso) y dispara, por una ventana corta, el flag para que las filas
 * hagan stagger-in, el flash verde del panel y la ráfaga de confeti.
 *
 * La detección de la transición ocurre durante el render (patrón "Adjusting
 * state when a prop changes" de React), no dentro de un efecto — evita
 * cascading renders. Los dos useEffect solo existen para apagar cada flag
 * tras su temporizador, y sus setState viven dentro del callback del timer.
 */

import { useEffect, useState } from "react";
import { useConfettiBurst } from "./useConfettiBurst";

const FLASH_MS = 750;
const REVEAL_MS = 900;

export function useSorteoRevealEffects(loading: boolean, pairingsCount: number) {
	const [prevLoading, setPrevLoading] = useState(loading);
	const [justRevealed, setJustRevealed] = useState(false);
	const [flashOn, setFlashOn] = useState(false);
	const confetti = useConfettiBurst();

	if (loading !== prevLoading) {
		setPrevLoading(loading);
		const finishedSuccessfully = prevLoading && !loading && pairingsCount > 0;
		if (finishedSuccessfully) {
			setJustRevealed(true);
			setFlashOn(true);
			confetti.burst();
		}
	}

	useEffect(() => {
		if (!justRevealed) return;
		const timer = setTimeout(() => setJustRevealed(false), REVEAL_MS);
		return () => clearTimeout(timer);
	}, [justRevealed]);

	useEffect(() => {
		if (!flashOn) return;
		const timer = setTimeout(() => setFlashOn(false), FLASH_MS);
		return () => clearTimeout(timer);
	}, [flashOn]);

	return {
		justRevealed,
		flashOn,
		confettiPieces: confetti.pieces,
		confettiBurstId: confetti.burstId,
	};
}
