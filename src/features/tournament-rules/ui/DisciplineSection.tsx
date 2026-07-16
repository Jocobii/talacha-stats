"use client";

/**
 * features/tournament-rules/ui/DisciplineSection.tsx
 * Umbrales de disciplina AUTOMÁTICA (amarillas/roja/azul). Las sanciones
 * graves (semanas/meses/veto) se gestionan aparte en Suspensiones (Épica B).
 */
import { Info } from "lucide-react";
import type { BlueCardMeaning } from "@/entities/league-config";
import { BLUE_CARD_LABELS } from "../types";
import { NumInput, SelectField } from "./controls";
import { FieldRow, SectionCard } from "./primitives";

type Props = {
	yellowThreshold: number;
	redCardMatches: number;
	blueCardMeaning: BlueCardMeaning;
	onYellowThresholdChange: (v: number) => void;
	onRedCardMatchesChange: (v: number) => void;
	onBlueCardMeaningChange: (v: BlueCardMeaning) => void;
	locked?: boolean;
};

const BLUE_CARD_OPTIONS = (Object.entries(BLUE_CARD_LABELS) as [BlueCardMeaning, string][]).map(
	([value, label]) => ({ value, label }),
);

export function DisciplineSection({
	yellowThreshold,
	redCardMatches,
	blueCardMeaning,
	onYellowThresholdChange,
	onRedCardMatchesChange,
	onBlueCardMeaningChange,
	locked,
}: Props) {
	return (
		<SectionCard title="Disciplina (automática)" locked={locked}>
			<FieldRow
				label="Amarillas acumuladas para 1 fecha de suspensión"
				hint="Al llegar a este número, el jugador se pierde la siguiente fecha automáticamente."
				isDefault={yellowThreshold === 5}
			>
				<NumInput value={yellowThreshold} onChange={onYellowThresholdChange} suffix="tarjetas" />
			</FieldRow>
			<FieldRow
				label="Fechas de suspensión por roja directa"
				hint="Jornadas que se pierde el jugador tras una expulsión directa."
				isDefault={redCardMatches === 1}
			>
				<NumInput value={redCardMatches} onChange={onRedCardMatchesChange} suffix="fecha(s)" />
			</FieldRow>
			<FieldRow
				label="Significado de la tarjeta azul"
				hint="Algunas ligas amateur usan tarjeta azul para expulsión temporal."
				isDefault={blueCardMeaning === "temp"}
			>
				<SelectField
					value={blueCardMeaning}
					onChange={onBlueCardMeaningChange}
					options={BLUE_CARD_OPTIONS}
				/>
			</FieldRow>
			<div className="flex gap-2.5 items-start mt-3.5 px-3.5 py-3 rounded-[10px] bg-surface-2 border border-line">
				<Info size={14} className="text-ink-2 mt-0.5 shrink-0" />
				<p className="text-xs text-ink-2 leading-relaxed">
					Estos umbrales solo cubren suspensiones automáticas por acumulación de tarjetas. Las
					sanciones graves (agresiones, vetos por semanas o meses) se gestionan caso por caso desde
					la pantalla de <strong>Suspensiones</strong>.
				</p>
			</div>
		</SectionCard>
	);
}
