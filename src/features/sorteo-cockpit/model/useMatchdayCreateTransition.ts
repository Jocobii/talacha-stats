"use client";

/**
 * features/sorteo-cockpit/model/useMatchdayCreateTransition.ts
 *
 * Anima la transición "Crear Jornada" → cockpit completo (ver mockup "Sorteo
 * Cockpit - Flujo Mejorado", pantalla stateCreate). Solo se activa cuando el
 * cambio null → jornada ocurre en vivo dentro de esta sesión; si la liga ya
 * tenía jornada al cargar la página, se muestra el layout de inmediato sin
 * animación.
 *
 * El ajuste de estado derivado de `hasMatchday` ocurre durante el render
 * (patrón "Adjusting state when a prop changes" de React, no dentro de un
 * efecto) para evitar cascading renders; el único useEffect existe para
 * suscribirse al temporizador de salida/entrada, y sus setState viven dentro
 * del callback del timer, no de forma síncrona en el cuerpo del efecto.
 */

import { useEffect, useState } from "react";

const EXIT_MS = 380;

export function useMatchdayCreateTransition(hasMatchday: boolean) {
	const [prevHasMatchday, setPrevHasMatchday] = useState(hasMatchday);
	const [showCreateForm, setShowCreateForm] = useState(!hasMatchday);
	const [formExiting, setFormExiting] = useState(false);
	const [layoutEntering, setLayoutEntering] = useState(false);

	if (hasMatchday !== prevHasMatchday) {
		setPrevHasMatchday(hasMatchday);
		if (hasMatchday) {
			setFormExiting(true);
		} else {
			setShowCreateForm(true);
			setFormExiting(false);
		}
	}

	useEffect(() => {
		if (!formExiting) return;
		const timer = setTimeout(() => {
			setShowCreateForm(false);
			setLayoutEntering(true);
			setFormExiting(false);
		}, EXIT_MS);
		return () => clearTimeout(timer);
	}, [formExiting]);

	return { showCreateForm, formExiting, layoutEntering };
}
