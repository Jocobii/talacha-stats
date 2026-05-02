"use client";

import { ImportWizard } from "@/features/import-excel/ui/ImportWizard";

export default function ImportPage() {
	return (
		<div className="max-w-3xl mx-auto">
			<div className="mb-5">
				<h1
					className="text-2xl font-black text-ink tracking-tight"
					style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
				>
					Importar Jornada
				</h1>
				<p className="text-sm text-ink-2 mt-0.5">
					Sube tu archivo de Excel y en minutos tus estadísticas estarán publicadas.
				</p>
			</div>

			<ImportWizard />
		</div>
	);
}
