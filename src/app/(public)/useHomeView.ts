"use client";

import { useCallback, useState } from "react";
import { HOME_VIEW_COOKIE, HOME_VIEW_COOKIE_MAX_AGE, type HomeView } from "./home-view";

/**
 * Estado de la vista del home (jugador/organizador).
 * El estado inicial llega resuelto desde el server (query param > cookie > default),
 * por lo que no hay lectura de storage en cliente ni riesgo de hydration mismatch.
 * La persistencia (cookie) se escribe solo dentro del callback de evento.
 */
export function useHomeView(initialView: HomeView) {
	const [view, setView] = useState<HomeView>(initialView);

	const selectView = useCallback((next: HomeView) => {
		setView(next);
		document.cookie = `${HOME_VIEW_COOKIE}=${next}; path=/; max-age=${HOME_VIEW_COOKIE_MAX_AGE}; samesite=lax`;
	}, []);

	return { view, selectView };
}
