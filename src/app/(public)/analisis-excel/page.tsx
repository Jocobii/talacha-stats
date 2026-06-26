import type { Metadata } from "next";
import { ExcelNarratorWizard } from "@/features/narrator-analysis/ui/ExcelNarratorWizard";

export const metadata: Metadata = {
	title: "Analiza tu liga desde Excel | TalachaStats",
	description:
		"Sube la tabla de posiciones de cualquier liga en Excel y genera al instante el análisis pre-partido del narrador: probabilidades, predicción y guion. Sin registro.",
};

// Flujo público — sin login ni token. Cualquiera puede usarlo.
export default function AnalisisExcelPage() {
	return (
		<div className="bg-surface flex-1 w-full">
			<ExcelNarratorWizard />
		</div>
	);
}
