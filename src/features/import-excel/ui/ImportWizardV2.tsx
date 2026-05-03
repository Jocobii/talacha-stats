"use client";

import { useImportWizardV2 } from "../hooks/useImportWizardV2";
import { StepBar } from "./StepBar";
import { UploadStep } from "./UploadStep";
import { PreviewStepV2 } from "./steps/PreviewStepV2";
import { DoubtsStep } from "./steps/DoubtsStep";
import { SuggestionsStep } from "./steps/SuggestionsStep";
import { ConfirmStepV2 } from "./steps/ConfirmStepV2";
import { ResultStepV2 } from "./steps/ResultStepV2";

// Re-use the existing step bar model — we need to register our new steps.
// StepBar reads from the "model" ImportStep type, so we define a small
// local adapter using the existing component (which accepts any ImportStep).
// Since WizardV2 has different step IDs, we render our own step indicator.

const V2_STEPS = [
	{ id: "upload", label: "Archivo" },
	{ id: "preview", label: "Vista previa" },
	{ id: "doubts", label: "Revisar dudas" },
	{ id: "suggestions", label: "Sugerencias" },
	{ id: "confirm", label: "Confirmar" },
	{ id: "result", label: "¡Listo!" },
] as const;

type V2StepId = (typeof V2_STEPS)[number]["id"];

function V2StepBar({ current }: { current: V2StepId }) {
	const visibleSteps = V2_STEPS;
	const currentIdx = visibleSteps.findIndex((s) => s.id === current);
	return (
		<div className="flex items-center gap-0 mb-7 overflow-x-auto pb-1">
			{visibleSteps.map((s, i) => {
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
							<span
								className={[
									"text-[13px] whitespace-nowrap",
									isActive ? "inline font-semibold text-brand" : "hidden sm:inline",
									isDone ? "text-brand" : "",
									!isDone && !isActive ? "text-ink-3" : "",
								].join(" ")}
							>
								{s.label}
							</span>
						</div>
						{i < visibleSteps.length - 1 && (
							<div
								className={[
									"h-0.5 mx-1.5 sm:mx-2 w-3 sm:w-8 shrink-0 transition-colors duration-300",
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
 * New import wizard using the L1-L4 matching pipeline.
 * Handles goleadores only (standings use the legacy wizard).
 *
 * Steps: upload → preview → doubts? → suggestions? → confirm → result
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
					// Lock to goleadores — this wizard only handles the new pipeline
					importType="goleadores"
					onImportTypeChange={() => {}}
					jornada={state.jornada}
					onJornadaChange={handlers.setJornada}
					file={state.file}
					onFileChange={handlers.setFile}
					// Templates not supported in V2 yet
					templates={[]}
					selectedTemplate=""
					onTemplateApply={() => {}}
					onSubmit={handlers.handlePreview}
					loading={loading}
					error={error}
				/>
			)}

			{step === "preview" && state.preview && (
				<PreviewStepV2
					preview={state.preview}
					warnings={state.preview.warnings}
					onContinue={handlers.goFromPreview}
					onBack={() => handlers.navigate("upload")}
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
					onReset={handlers.reset}
				/>
			)}
		</>
	);
}
