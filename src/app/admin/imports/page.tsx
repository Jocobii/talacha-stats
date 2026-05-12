"use client";

import { Suspense, useState } from "react";
import { ImportWizardV2 } from "@/features/import-excel/ui/ImportWizardV2";
import { ImportWizard } from "@/features/import-excel/ui/ImportWizard";
import NewLeagueBanner from "./NewLeagueBanner";

type Tab = "goleadores" | "standings";

const TABS: { id: Tab; label: string; emoji: string; desc: string }[] = [
	{
		id: "goleadores",
		label: "Goleadores",
		emoji: "⚽",
		desc: "Estadísticas de jugadores (pipeline L1–L4)",
	},
	{
		id: "standings",
		label: "Posiciones",
		emoji: "📊",
		desc: "Tabla de clasificación de equipos",
	},
];

/**
 * /admin/imports
 *
 * Página unificada de importación. Dos pestañas:
 *  - Goleadores → ImportWizardV2 (pipeline L1-L4, /api/imports/*)
 *  - Posiciones  → ImportWizard  (motor legacy, /api/import/bulk, type=standings)
 */
export default function ImportsPage() {
	const [activeTab, setActiveTab] = useState<Tab>("goleadores");

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
					Importar Jornada
				</h1>
				<p className="text-sm text-ink-2 mt-0.5">
					Sube el Excel de la jornada. Elige el tipo de datos a importar.
				</p>
			</div>

			{/* Tab switcher */}
			<div className="flex gap-2 mb-6 p-1 bg-surface-2 rounded-2xl">
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
						<span>{tab.emoji}</span>
						<span>{tab.label}</span>
					</button>
				))}
			</div>

			{/* Active tab description */}
			<p className="text-xs text-ink-3 mb-4 -mt-3">{TABS.find((t) => t.id === activeTab)?.desc}</p>

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
