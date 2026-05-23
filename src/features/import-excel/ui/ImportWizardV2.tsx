"use client";

import { useImportWizardV2 } from "../hooks/useImportWizardV2";
import { UploadStep } from "./UploadStep";
import { SheetSelectStep } from "./steps/SheetSelectStep";
import { PreviewStepV2 } from "./steps/PreviewStepV2";
import { DoubtsStep } from "./steps/DoubtsStep";
import { SuggestionsStep } from "./steps/SuggestionsStep";
import { ConfirmStepV2 } from "./steps/ConfirmStepV2";
import { ResultStepV2 } from "./steps/ResultStepV2";

// El paso "sheet" solo aparece cuando el archivo tiene > 1 hoja, así que
// lo excluimos del step bar para no confundir al usuario cuando no aplica.
const V2_STEPS = [
	{ id: "upload", label: "Archivo" },
	{ id: "preview", label: "Vista previa" },
	{ id: "doubts", label: "Revisar dudas" },
	{ id: "suggestions", label: "Sugerencias" },
	{ id: "confirm", label: "Confirmar" },
	{ id: "result", label: "¡Listo!" },
] as const;

type V2StepId = (typeof V2_STEPS)[number]["id"] | "sheet";

function V2StepBar({ current }: { current: V2StepId }) {
	// "sheet" se muestra como si fuera "upload" en la barra (es parte del mismo flujo)
	const barStep = current === "sheet" ? "upload" : current;
	const currentIdx = V2_STEPS.findIndex((s) => s.id === barStep);
	return (
		<div className="flex items-center gap-0 mb-7 overflow-hidden">
			{V2_STEPS.map((s, i) => {
				const isDone = i < currentIdx;
				const isActive = i === currentIdx;
				return (
					<div key={s.id} className="flex items-center gap-0 shrink-0">
						<div className="flex items-center gap-1.5">
							<div
								className={[
									"w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all duration-300",
									isDone ? "bg-brand text-pitch" : "",
									isActive ? "bg-brand/15 text-white shadow-[0_0_0_4px_rgba(22,163,74,0.2)]" : "",
									!isDone && !isActive ? "bg-surface-2 text-ink-3" : "",
								].join(" ")}
							>
								{isDone ? "✓" : i + 1}
							</div>
							{isActive && (
								<span className="text-[13px] whitespace-nowrap font-semibold text-brand-ink">
									{s.label}
								</span>
							)}
						</div>
						{i < V2_STEPS.length - 1 && (
							<div
								className={[
									"h-0.5 mx-2 w-4 shrink-0 transition-colors duration-300",
									isDone ? "bg-brand" : "bg-surface-2",
								].join(" ")}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

/**
 * ImportWizardV2
 *
 * Wizard de importación de goleadores usando el pipeline L1-L4.
 *
 * Pasos: upload → [sheet]? → preview → doubts? → suggestions? → confirm → result
 * El paso "sheet" solo aparece cuando el Excel tiene más de una hoja.
 */
export function ImportWizardV2() {
	const { state, derived, handlers } = useImportWizardV2();
	const { step, loading, error } = state;

	return (
		<>
			<V2StepBar current={step} />

			{step === "upload" && (
				<UploadStep
					leagueId={state.leagueId}
					onLeagueChange={handlers.setLeagueId}
					importType="goleadores"
					onImportTypeChange={() => {}}
					hideTypeSelector={true}
					jornada={state.jornada}
					onJornadaChange={handlers.setJornada}
					file={state.file}
					onFileChange={handlers.setFile}
					templates={[]}
					selectedTemplate=""
					onTemplateApply={() => {}}
					onSubmit={handlers.handleDetect}
					loading={loading}
					error={error}
				/>
			)}

			{step === "sheet" && (
				<SheetSelectStep
					sheets={state.sheets}
					selectedSheet={state.selectedSheet}
					onSheetChange={handlers.handleSheetChange}
					excelPreview={state.excelPreview}
					loading={loading}
					error={error}
					onBack={() => handlers.navigate("upload")}
					onSubmit={handlers.handlePreview}
				/>
			)}

			{step === "preview" && state.preview && (
				<PreviewStepV2
					preview={state.preview}
					warnings={state.preview.warnings}
					onContinue={handlers.goFromPreview}
					onBack={() => handlers.navigate(state.sheets.length > 1 ? "sheet" : "upload")}
				/>
			)}

			{step === "doubts" && state.preview && (
				<DoubtsStep
					doubts={derived.doubts}
					decisions={state.decisions}
					onDecide={handlers.setDecision}
					allDone={derived.allDoubtsDone}
					onContinue={handlers.goFromDoubts}
					onBack={() => handlers.navigate("preview")}
				/>
			)}

			{step === "suggestions" && state.preview && (
				<SuggestionsStep
					suggestions={derived.suggestions}
					decisions={state.decisions}
					onDecide={handlers.setDecision}
					onContinue={() => handlers.navigate("confirm")}
					onBack={() => handlers.navigate(derived.hasDoubts ? "doubts" : "preview")}
				/>
			)}

			{step === "confirm" && state.preview && (
				<ConfirmStepV2
					preview={state.preview}
					decisions={state.decisions}
					loading={loading}
					error={error}
					onConfirm={handlers.handleConfirm}
					onBack={() =>
						handlers.navigate(
							derived.hasSuggestions ? "suggestions" : derived.hasDoubts ? "doubts" : "preview",
						)
					}
				/>
			)}

			{step === "result" && state.result && (
				<ResultStepV2
					result={state.result}
					jornada={state.preview?.jornada}
					leagueId={state.leagueId}
					onReset={handlers.reset}
				/>
			)}
		</>
	);
}
