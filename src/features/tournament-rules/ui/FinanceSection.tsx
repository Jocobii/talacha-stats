"use client";

/**
 * features/tournament-rules/ui/FinanceSection.tsx
 * Nivel de control financiero (Épica C — §3 docs/MODULOS-GESTION-LIGA.md).
 * Solo el nivel vive en league_config; catálogo de conceptos y montos
 * (inscripción, multas, depósito) se capturan en el módulo de Finanzas
 * cuando se construya — aquí no se fingen inputs sin backend.
 */
import { FINANCE_LEVEL_LABELS } from "../types";
import { Segmented } from "./controls";
import { Accordion, FieldRow } from "./primitives";

type Props = {
	financeLevel: 0 | 1 | 2;
	onChange: (v: 0 | 1 | 2) => void;
};

const OPTIONS = (Object.entries(FINANCE_LEVEL_LABELS) as [string, string][]).map(
	([value, label]) => ({
		value: Number(value) as 0 | 1 | 2,
		label,
	}),
);

export function FinanceSection({ financeLevel, onChange }: Props) {
	return (
		<Accordion
			title="Finanzas"
			subtitle="Opcional — controla cobros y multas dentro de la plataforma."
		>
			<FieldRow
				label="Nivel de control financiero"
				hint="Básico registra pagos manualmente. Completo activa recordatorios, multas y reportes."
				isDefault={financeLevel === 0}
			>
				<Segmented value={financeLevel} onChange={onChange} options={OPTIONS} />
			</FieldRow>
			{financeLevel !== 0 && (
				<p className="text-xs text-ink-3 mt-2 leading-relaxed">
					Los conceptos y montos (inscripción, multas, depósito) se configuran en el módulo de
					Finanzas — próximamente.
				</p>
			)}
		</Accordion>
	);
}
