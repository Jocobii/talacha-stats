import { ImportWizardV2 } from "@/features/import-excel/ui/ImportWizardV2";

/**
 * /admin/imports
 *
 * Wizard de importacion con el pipeline de matching por capas (L1-L4).
 * Solo goleadores. Server Component que monta el wizard cliente.
 */
export default function ImportsPage() {
	return (
		<div className="max-w-3xl mx-auto">
			<div className="mb-5">
				<h1
					className="text-2xl font-black text-ink tracking-tight"
					style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
				>
					Importar Goleadores
				</h1>
				<p className="text-sm text-ink-2 mt-0.5">
					Sube el Excel de la jornada. Resolveremos automaticamente quienes son los mismos jugadores
					de semanas anteriores.
				</p>
			</div>

			<ImportWizardV2 />
		</div>
	);
}
