"use client";

import { LeagueSelect } from "@/shared/ui/LeagueSelect";
import { FileDropzone } from "./FileDropzone";
import type { ImportTemplate } from "../model";

type Props = {
	leagueId: string;
	onLeagueChange: (id: string) => void;
	importType: "goleadores" | "standings";
	onImportTypeChange: (type: "goleadores" | "standings") => void;
	jornada: string;
	onJornadaChange: (value: string) => void;
	file: File | null;
	onFileChange: (file: File | null) => void;
	templates: ImportTemplate[];
	selectedTemplate: string;
	onTemplateApply: (id: string) => void;
	hideTypeSelector?: boolean;
	onSubmit: () => void;
	loading: boolean;
	error: string;
};

export function UploadStep({
	leagueId,
	onLeagueChange,
	importType,
	onImportTypeChange,
	jornada,
	onJornadaChange,
	file,
	onFileChange,
	templates,
	selectedTemplate,
	onTemplateApply,
	hideTypeSelector = false,
	onSubmit,
	loading,
	error,
}: Props) {
	const relevantTemplates = templates.filter((t) => t.type === importType);

	const decrementJornada = () => onJornadaChange(String(Math.max(1, (parseInt(jornada) || 1) - 1)));

	const incrementJornada = () => onJornadaChange(String((parseInt(jornada) || 0) + 1));

	return (
		<div className="flex flex-col gap-5">
			{/* Saved templates banner */}
			{relevantTemplates.length > 0 && (
				<div className="rounded-2xl border border-brand/20 bg-brand/10 p-4 flex items-center gap-3">
					<span className="text-2xl shrink-0">💾</span>
					<div className="flex-1">
						<p className="text-sm font-semibold text-brand">¿Usar configuración guardada?</p>
						<div className="flex gap-2 mt-2 flex-wrap">
							{relevantTemplates.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => onTemplateApply(t.id)}
									className={[
										"px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-all",
										selectedTemplate === t.id
											? "bg-brand border-brand text-pitch"
											: "bg-surface border-brand/30 text-brand hover:border-brand",
									].join(" ")}
								>
									{t.name}
									{selectedTemplate === t.id && " ✓"}
								</button>
							))}
						</div>
					</div>
					{selectedTemplate && (
						<span className="shrink-0 text-xs font-semibold text-brand bg-surface border border-brand/20 rounded-lg px-2 py-1">
							Mapeo automático
						</span>
					)}
				</div>
			)}

			<div className="bg-surface rounded-2xl shadow-sm border border-line p-6 flex flex-col gap-5">
				<h2 className="text-lg font-bold text-ink">Subir archivo de jornada</h2>

				{/* League selector */}
				<div>
					<label className="block text-sm font-semibold text-ink mb-1.5">
						Liga <span className="text-red-500">*</span>
					</label>
					<LeagueSelect value={leagueId} onChange={onLeagueChange} />
				</div>

				{/* Import type — hidden when locked via tab */}
				{!hideTypeSelector && (
				<div>
					<label className="block text-sm font-semibold text-ink mb-2">Tipo de datos</label>
					<div className="grid grid-cols-2 gap-3">
						{(["goleadores", "standings"] as const).map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => onImportTypeChange(t)}
								className={[
									"py-3.5 px-3 rounded-xl border-2 text-left transition-all",
									importType === t
										? "border-brand bg-brand/10"
										: "border-line bg-surface hover:border-line",
								].join(" ")}
							>
								<div
									className={`text-[15px] font-bold ${importType === t ? "text-brand" : "text-ink"}`}
								>
									{t === "goleadores" ? "⚽  Goleadores" : "📊  Tabla de posiciones"}
								</div>
								<div className="text-xs text-ink-2 mt-0.5">
									{t === "goleadores" ? "Estadísticas de jugadores" : "Clasificación de equipos"}
								</div>
							</button>
						))}
					</div>
				</div>
				)}

				{/* Jornada */}
				<div>
					<label className="block text-sm font-semibold text-ink mb-2">
						Número de jornada
						{importType === "goleadores" && (
							<span className="ml-1.5 text-xs font-normal text-orange-600">* requerida</span>
						)}
					</label>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={decrementJornada}
							className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-xl font-bold text-ink-2 hover:border-line transition shrink-0"
						>
							−
						</button>
						<input
							type="number"
							min="1"
							value={jornada}
							onChange={(e) => onJornadaChange(String(Math.max(1, parseInt(e.target.value) || 1)))}
							className="w-20 text-center text-3xl font-black text-brand border-2 border-brand/30 rounded-xl py-1.5 bg-brand/10 outline-none focus:border-brand"
							style={
								{
									fontFamily: "'Barlow Condensed', sans-serif",
									MozAppearance: "textfield",
								} as React.CSSProperties
							}
						/>
						<button
							type="button"
							onClick={incrementJornada}
							className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-xl font-bold text-ink-2 hover:border-line transition shrink-0"
						>
							+
						</button>
						<span className="text-sm text-ink-3 hidden sm:inline">de la temporada</span>
					</div>
				</div>

				{/* File drag & drop */}
				<div>
					<label className="block text-sm font-semibold text-ink mb-2">Archivo Excel</label>
					<FileDropzone file={file} onFileChange={onFileChange} />
				</div>
			</div>

			{error && (
				<p className="text-red-600 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2.5 rounded-xl">
					{error}
				</p>
			)}

			<button
				type="button"
				onClick={onSubmit}
				disabled={loading || !file || !leagueId}
				className={[
					"w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all",
					!loading && file && leagueId
						? "bg-brand hover:bg-brand-dim shadow-[0_4px_12px_rgba(22,163,74,0.35)]"
						: "bg-line cursor-not-allowed",
				].join(" ")}
			>
				{loading ? (
					<>
						<span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						Leyendo archivo...
					</>
				) : (
					<>
						Continuar <span className="text-lg">→</span>
					</>
				)}
			</button>
		</div>
	);
}
