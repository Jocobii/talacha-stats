"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ImportWizardV2 } from "@/features/import-excel/ui/ImportWizardV2";
import { ImportWizard } from "@/features/import-excel/ui/ImportWizard";
import NewLeagueBanner from "./NewLeagueBanner";

type Tab = "standings" | "goleadores";

const TABS: { id: Tab; label: string; step: number; desc: string }[] = [
	{
		id: "standings",
		label: "Tabla de posiciones",
		step: 1,
		desc: "Empieza aquí. Importa los equipos y sus resultados de la temporada.",
	},
	{
		id: "goleadores",
		label: "Goleadores",
		step: 2,
		desc: "Segundo paso. Importa las estadísticas de jugadores — los equipos deben existir primero.",
	},
];

/**
 * /admin/imports
 *
 * Página unificada de importación. Dos pestañas en orden obligatorio:
 *  1. Posiciones  → ImportWizard  (motor legacy, /api/import/bulk, type=standings)
 *  2. Goleadores → ImportWizardV2 (pipeline L1-L4, /api/imports/*)
 */
function ImportsPageContent() {
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab") as Tab | null;
	const [activeTab, setActiveTab] = useState<Tab>(
		tabParam === "goleadores" ? "goleadores" : "standings",
	);

	// Sincronizar si el param cambia (ej: navegación desde DoneStep)
	useEffect(() => {
		if (tabParam === "goleadores" || tabParam === "standings") {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setActiveTab(tabParam);
		}
	}, [tabParam]);

	return (
		<div className="max-w-3xl mx-auto">
			<Suspense fallback={null}>
				<NewLeagueBanner />
			</Suspense>

			<div className="mb-5">
				<h1
					className="text-2xl font-black text-ink tracking-tight"
					style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
				>
					Importar datos
				</h1>
				<p className="text-sm text-ink-2 mt-0.5">
					Sigue el orden. Primero la tabla de posiciones, luego los goleadores.
				</p>
			</div>

			{/* Tab switcher con numeración explícita */}
			<div className="flex gap-2 mb-2 p-1 bg-surface-2 rounded-2xl">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className={[
							"flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all",
							activeTab === tab.id
								? "bg-surface shadow-sm text-brand"
								: "text-ink-2 hover:text-ink",
						].join(" ")}
					>
						<span
							className={[
								"w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0",
								activeTab === tab.id ? "bg-brand text-pitch" : "bg-surface text-ink-3",
							].join(" ")}
						>
							{tab.step}
						</span>
						<span>{tab.label}</span>
					</button>
				))}
			</div>

			{/* Descripción del paso activo */}
			<p className="text-xs text-ink-3 mb-6 px-1">{TABS.find((t) => t.id === activeTab)?.desc}</p>

			{/* Wizard content — keep both mounted so state survives tab switches */}
			<div className={activeTab === "goleadores" ? "" : "hidden"}>
				<ImportWizardV2 />
			</div>
			<div className={activeTab === "standings" ? "" : "hidden"}>
				<ImportWizard initialImportType="standings" />
			</div>
		</div>
	);
}

export default function ImportsPage() {
	return (
		<Suspense fallback={null}>
			<ImportsPageContent />
		</Suspense>
	);
}
