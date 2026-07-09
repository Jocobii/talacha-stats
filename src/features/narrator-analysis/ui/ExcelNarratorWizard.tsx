/**
 * ExcelNarratorWizard — orquestador del flujo Excel público (mobile-first).
 * Camino más corto: si la autodetección resuelve las columnas, salta de Subir a
 * Equipos. CTA primario siempre fijo en la zona del pulgar. Estado en memoria
 * (se limpia al refrescar o subir otro Excel).
 */

"use client";

import { ArrowLeft, RotateCcw, Users } from "lucide-react";
import { useExcelNarratorWizard } from "../model/use-excel-narrator-wizard";
import { WizardProgress } from "./wizard/WizardProgress";
import { StickyBar, PrimaryButton } from "./wizard/StickyBar";
import { UploadStep } from "./wizard/UploadStep";
import { MappingStep } from "./wizard/MappingStep";
import { TeamSelectStep } from "./wizard/TeamSelectStep";
import { SheetPicker } from "./wizard/SheetPicker";
import { NarratorReport } from "./NarratorReport";

export function ExcelNarratorWizard() {
	const w = useExcelNarratorWizard();
	const { step } = w.state;

	return (
		<div className="flex flex-col flex-1 min-h-screen text-ink">
			<header className="px-4 pt-6 pb-3 max-w-2xl mx-auto w-full">
				{step !== "upload" && (
					<button
						type="button"
						onClick={w.back}
						className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm mb-3"
					>
						<ArrowLeft size={16} /> Atrás
					</button>
				)}
				<h1 className="font-display font-black text-3xl uppercase tracking-wide leading-none mb-4">
					Analiza tu liga
				</h1>
				<WizardProgress current={step} />
				{(step === "mapping" || step === "teams") && (
					<SheetPicker
						sheetNames={w.state.sheetNames}
						selectedIndex={w.state.selectedSheetIndex}
						onChange={w.changeSheet}
						loading={w.parsing}
					/>
				)}
			</header>

			<main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
				{step === "upload" && (
					<UploadStep
						leagueName={w.state.leagueName}
						onLeagueName={w.setLeagueName}
						onFile={w.handleFile}
						parsing={w.parsing}
						error={w.parseError}
					/>
				)}

				{step === "mapping" && w.state.grid && (
					<MappingStep
						grid={w.state.grid}
						headerRowIndex={w.state.headerRowIndex}
						headers={w.headers}
						mapping={w.state.mapping}
						onHeaderRow={w.setHeaderRow}
						onField={w.setField}
					/>
				)}

				{step === "teams" && (
					<TeamSelectStep
						standings={w.standings}
						teamAId={w.state.teamAId}
						teamBId={w.state.teamBId}
						onSelect={w.selectTeam}
						onAdjustColumns={w.openMapping}
					/>
				)}

				{step === "report" && w.state.analysis && (
					<NarratorReport
						analysis={w.state.analysis}
						actions={
							<>
								<button
									type="button"
									onClick={w.changeTeams}
									className="flex items-center gap-1.5 bg-surface-2 border border-line text-ink-2 hover:text-ink text-sm font-medium px-4 py-2 rounded-xl transition"
								>
									<Users size={14} /> Cambiar equipos
								</button>
								<button
									type="button"
									onClick={w.reset}
									className="flex items-center gap-1.5 bg-surface-2 border border-line text-ink-2 hover:text-ink text-sm font-medium px-4 py-2 rounded-xl transition"
								>
									<RotateCcw size={14} /> Otro Excel
								</button>
							</>
						}
					/>
				)}
			</main>

			<WizardFooter wizard={w} />
		</div>
	);
}

function WizardFooter({ wizard: w }: { wizard: ReturnType<typeof useExcelNarratorWizard> }) {
	const { step } = w.state;

	if (step === "mapping") {
		return (
			<StickyBar>
				{!w.requiredComplete && (
					<p className="text-xs text-red-400 mb-2 text-center">
						Asigna las 4 columnas obligatorias para continuar.
					</p>
				)}
				<PrimaryButton onClick={w.confirmMapping} disabled={!w.requiredComplete}>
					Continuar
				</PrimaryButton>
			</StickyBar>
		);
	}

	if (step === "teams") {
		return (
			<StickyBar>
				{w.analyzeError && (
					<p className="text-xs text-red-400 mb-2 text-center">{w.analyzeError}</p>
				)}
				<PrimaryButton onClick={w.runAnalysis} disabled={!w.canAnalyze} loading={w.analyzing}>
					Generar análisis
				</PrimaryButton>
			</StickyBar>
		);
	}

	if (step === "report") {
		return (
			<StickyBar>
				<PrimaryButton onClick={w.changeTeams}>Cambiar equipos</PrimaryButton>
				<button
					type="button"
					onClick={w.reset}
					className="w-full mt-2 text-sm text-ink-3 hover:text-ink-2 py-2"
				>
					Subir otro Excel
				</button>
			</StickyBar>
		);
	}

	return null;
}
