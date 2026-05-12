"use client";

import { useImportWizard } from "../hooks/useImportWizard";
import { StepBar } from "./StepBar";
import { UploadStep } from "./UploadStep";
import { MapStep } from "./MapStep";
import { PreviewStep } from "./PreviewStep";
import { DoneStep } from "./DoneStep";

/**
 * ImportWizard
 *
 * Componente raíz del wizard de importación. No contiene lógica propia:
 * conecta useImportWizard (estado + handlers) con los componentes de cada paso.
 *
 * Props: ninguna — el wizard es autónomo.
 */
type ImportWizardProps = {
	initialImportType?: "goleadores" | "standings";
};

export function ImportWizard({ initialImportType }: ImportWizardProps = {}) {
	const { state, derived, handlers } = useImportWizard({ initialImportType });
	const { step, loading, error } = state;

	const handleCopyPill = (idx: number, text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			handlers.setCopiedIdx(idx);
			setTimeout(() => handlers.setCopiedIdx(null), 1800);
		});
	};

	return (
		<>
			<StepBar current={step} />

			{step === "upload" && (
				<UploadStep
					leagueId={state.leagueId}
					onLeagueChange={handlers.setLeagueId}
					importType={state.importType}
					onImportTypeChange={handlers.setImportType}
					hideTypeSelector={!!initialImportType}
					jornada={state.jornada}
					onJornadaChange={handlers.setJornada}
					file={state.file}
					onFileChange={handlers.setFile}
					templates={state.templates}
					selectedTemplate={state.selectedTemplate}
					onTemplateApply={handlers.applyTemplate}
					onSubmit={handlers.handleDetect}
					loading={loading}
					error={error}
				/>
			)}

			{step === "map" && (
				<MapStep
					sheets={state.sheets}
					activeSheet={state.activeSheet}
					onSheetChange={handlers.handleSheetChange}
					excelPreview={state.excelPreview}
					headerRow={state.headerRow}
					onHeaderRowChange={handlers.setHeaderRow}
					headerCols={derived.headerCols}
					fields={derived.fields}
					columnMap={state.columnMap}
					onColumnMapChange={handlers.setColumnMap}
					mappedCount={derived.mappedCount}
					allReqDone={derived.allReqDone}
					hasGoodHeaders={derived.hasGoodHeaders}
					importType={state.importType}
					newTemplateName={state.newTemplateName}
					onNewTemplateNameChange={handlers.setNewTemplateName}
					onSaveTemplate={handlers.handleSaveTemplate}
					savingTemplate={state.savingTemplate}
					templateSaved={state.templateSaved}
					onBack={() => handlers.navigate("upload")}
					onSubmit={handlers.handlePreview}
					loading={loading}
					error={error}
				/>
			)}

			{step === "preview" && state.preview && (
				<PreviewStep
					preview={state.preview}
					resolutions={state.resolutions}
					onResolve={handlers.setResolution}
					excludedRows={state.excludedRows}
					onToggleExclude={handlers.toggleExcludedRow}
					onClearExcluded={handlers.clearExcludedRows}
					ambiguous={derived.ambiguous}
					confirmed={derived.confirmed}
					newPlayers={derived.newPlayers}
					pendingCount={derived.pendingCount}
					allResolved={derived.allResolved}
					onBack={() => handlers.navigate("map")}
					onConfirm={handlers.handleConfirm}
					loading={loading}
					error={error}
				/>
			)}

			{step === "done" && state.result && (
				<DoneStep
					result={state.result}
					leagueId={state.leagueId}
					copiedIdx={state.copiedIdx}
					onCopy={handleCopyPill}
					onReset={handlers.reset}
				/>
			)}
		</>
	);
}
