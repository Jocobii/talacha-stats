"use client";

import type { ReactNode } from "react";
import type { HomeView } from "./home-view";
import { useHomeView } from "./useHomeView";
import ViewToggle from "./ViewToggle";

type HomeViewsProps = {
	initialView: HomeView;
	jugador: ReactNode;
	organizador: ReactNode;
};

/**
 * Orquestador de las dos vistas del home. Ambas se renderizan en el server
 * (llegan como slots) y siempre existen en el HTML — el toggle solo alterna
 * visibilidad, para no perder SEO del contenido oculto.
 */
export default function HomeViews({ initialView, jugador, organizador }: HomeViewsProps) {
	const { view, selectView } = useHomeView(initialView);

	return (
		<>
			<div className="bg-pitch flex justify-center px-5 pt-6">
				<ViewToggle view={view} onSelect={selectView} />
			</div>
			<div className={view === "jugador" ? "flex flex-col flex-1" : "hidden"}>{jugador}</div>
			<div className={view === "organizador" ? "flex flex-col flex-1" : "hidden"}>
				{organizador}
			</div>
		</>
	);
}
