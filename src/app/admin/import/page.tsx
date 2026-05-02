"use client";

/**
 * ImportPageRedesign.tsx
 *
 * Drop-in replacement for src/app/admin/import/page.tsx
 *
 * ── Qué cambió vs. el original ──────────────────────────────────────────────
 *  • SOLO el JSX del render. Toda la lógica de negocio, estado y handlers
 *    son idénticos al original. No se tocó ninguna llamada a la API.
 *
 *  Paso 1: Zona drag & drop grande en lugar del input pequeño.
 *          Selector de jornada con botones +/− legibles.
 *          Banner de plantillas guardadas al inicio.
 *          Link "Descargar formato de ejemplo".
 *
 *  Paso 2: Mapeo visual por clic (panel izq: campos, panel der: columnas Excel).
 *          Sin índices numéricos ni lenguaje técnico.
 *          Barra de progreso + checks verdes animados.
 *          "Guardar plantilla" visible desde el inicio.
 *
 *  Paso 3 goleadores: PlayerResolutionCard con 3 estados (confirmado/ambiguo/nuevo).
 *          Candidatos como botones táctiles grandes. Botón de confirmar bloqueado
 *          mientras haya jugadores sin resolver.
 *  Paso 3 posiciones: Tabla limpia con colores semánticos.
 *
 *  Paso 4: Pantalla de éxito con métricas, highlights copiables, descarga imagen.
 *
 * ── Para probar ─────────────────────────────────────────────────────────────
 *  1. Copia este archivo a src/app/admin/import/page.tsx (guardando el original).
 *  2. npm run dev y navega a /admin/import.
 *  3. Si todo funciona igual que antes + nuevo diseño → mergear.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import { LeagueSelect } from "@/shared/ui/LeagueSelect";

// ── Tipos (idénticos al original) ─────────────────────────────────────────
type ImportTemplate = {
	id: string;
	name: string;
	type: "goleadores" | "standings";
	headerRow: number;
	columnMap: string;
};

type PlayerCandidate = {
	id: string;
	fullName: string;
	alias: string | null;
	teams: { teamName: string; leagueName: string }[];
};

type PlayerResolution = {
	rawName: string;
	teamName: string;
	found: boolean;
	playerId?: string;
	candidates: PlayerCandidate[];
};

type GoleadoresRow = { rawName: string; teamName: string; goals: number };
type StandingsRow = {
	position: number;
	teamName: string;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	points: number;
};

type AnomalyLevel = "ok" | "warning" | "critical";
type AnomalyFlag = {
	rule: string;
	level: AnomalyLevel;
	message: string;
	context: { current: number; previous?: number; average?: number; zscore?: number };
};
type AnomalyReport = {
	rawName: string;
	level: AnomalyLevel;
	flags: AnomalyFlag[];
};

type BulkPreview = {
	type: "goleadores" | "standings";
	jornada?: number;
	rows: GoleadoresRow[] | StandingsRow[];
	playerResolutions?: PlayerResolution[];
	anomalyReports?: AnomalyReport[];
	warnings: string[];
	summary: { players?: number; teams?: number; totalGoals?: number };
};

type ImportResult = {
	upserted: number;
	created: number;
	warnings: string[];
	content: {
		jornada: number;
		pills: { type: string; headline: string; detail: string; priority: number }[];
		imageUrl: string;
	} | null;
};

type Step = "upload" | "map" | "preview" | "done";

// ── Constantes de campos (idénticas al original) ──────────────────────────
const GOLEADORES_FIELDS = [
	{ key: "rawName", label: "Nombre del jugador", required: true },
	{ key: "teamName", label: "Equipo", required: false },
	{ key: "goals", label: "Goles", required: true },
	{ key: "assists", label: "Asistencias", required: false },
	{ key: "yellowCards", label: "Tarjetas amarillas", required: false },
	{ key: "redCards", label: "Tarjetas rojas", required: false },
	{ key: "matchesPlayed", label: "Partidos jugados", required: false },
];

const STANDINGS_FIELDS = [
	{ key: "teamName", label: "Equipo", required: true },
	{ key: "played", label: "Partidos jugados (JJ)", required: false },
	{ key: "wins", label: "Ganados (JG)", required: false },
	{ key: "draws", label: "Empatados (JE)", required: false },
	{ key: "losses", label: "Perdidos (JP)", required: false },
	{ key: "goalsFor", label: "Goles a favor (GF)", required: false },
	{ key: "goalsAgainst", label: "Goles en contra (GC)", required: false },
	{ key: "points", label: "Puntos (PTS)", required: true },
];

// ── Sub-componentes de UI ─────────────────────────────────────────────────

/** Barra de pasos con líneas conectoras */
function StepBar({ current }: { current: Step }) {
	const steps: { id: Step; label: string }[] = [
		{ id: "upload", label: "Archivo" },
		{ id: "map", label: "Revisar columnas" },
		{ id: "preview", label: "Vista previa" },
		{ id: "done", label: "¡Listo!" },
	];
	const order = steps.map((s) => s.id);
	const currentIdx = order.indexOf(current);

	return (
		<div className="flex items-center gap-0 mb-7">
			{steps.map((s, i) => {
				const isDone = i < currentIdx;
				const isActive = i === currentIdx;
				return (
					<div key={s.id} className="flex items-center gap-0">
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
							{/* Desktop: always show label. Mobile: only show label for active step */}
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
						{i < steps.length - 1 && (
							<div
								className={[
									"h-0.5 mx-1.5 sm:mx-2 w-3 sm:w-10 shrink-0 transition-colors duration-300",
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

/** Tarjeta de resolución para un jugador ambiguo */
function PlayerResolutionCard({
	pm,
	resolution,
	onResolve,
}: {
	pm: PlayerResolution;
	resolution: string;
	onResolve: (rawName: string, id: string) => void;
}) {
	const isResolved = !!resolution;
	const chosenCandidate = pm.candidates.find((c) => c.id === resolution);

	return (
		<div
			className={[
				"rounded-2xl border-2 overflow-hidden transition-all duration-200",
				isResolved ? "border-brand/30 bg-brand/10" : "border-orange-300 bg-surface",
			].join(" ")}
		>
			{/* Header */}
			<div
				className={[
					"px-4 py-3 flex items-center gap-3 border-b",
					isResolved ? "border-green-100" : "border-orange-100",
				].join(" ")}
			>
				<div
					className={[
						"w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-lg",
						isResolved ? "bg-brand/15" : "bg-orange-100",
					].join(" ")}
				>
					{isResolved ? "✅" : "⚠️"}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline gap-2 flex-wrap">
						<span className="text-base font-extrabold text-ink">{pm.rawName}</span>
						{pm.teamName && <span className="text-xs text-ink-2">{pm.teamName}</span>}
					</div>
					{isResolved && resolution !== "NEW" && chosenCandidate && (
						<p className="text-xs text-brand font-medium mt-0.5">
							→ {chosenCandidate.fullName}
							{chosenCandidate.alias ? ` "${chosenCandidate.alias}"` : ""}
						</p>
					)}
					{isResolved && resolution === "NEW" && (
						<p className="text-xs text-blue-300 font-medium mt-0.5">→ Se creará jugador nuevo</p>
					)}
					{!isResolved && <p className="text-xs text-orange-700 mt-0.5">¿Cuál es este jugador?</p>}
				</div>
			</div>

			{/* Candidates */}
			<div className="px-4 py-3 flex flex-col gap-2">
				<p className="text-xs font-semibold text-ink-2 mb-1">Elige el jugador correcto:</p>

				{pm.candidates.map((c) => {
					const selected = resolution === c.id;
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => onResolve(pm.rawName, c.id)}
							className={[
								"flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left w-full transition-all duration-150",
								selected
									? "border-brand bg-brand/10"
									: "border-line bg-surface-2 hover:border-brand/30",
							].join(" ")}
						>
							{/* Radio */}
							<div
								className={[
									"w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all",
									selected ? "border-green-600 bg-brand" : "border-line bg-surface",
								].join(" ")}
							>
								{selected && <div className="w-1.5 h-1.5 rounded-full bg-surface" />}
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-1.5 flex-wrap">
									<span className="text-sm font-bold text-ink">{c.fullName}</span>
									{c.alias && (
										<span className="text-xs text-ink-2 italic">&quot;{c.alias}&quot;</span>
									)}
								</div>
								{c.teams.length > 0 && (
									<div className="flex gap-1 mt-1 flex-wrap">
										{c.teams.map((t, i) => (
											<span
												key={i}
												className="text-[11px] bg-surface-2 text-ink-2 px-2 py-0.5 rounded-full"
											>
												{t.teamName} · {t.leagueName}
											</span>
										))}
									</div>
								)}
							</div>

							{selected && <span className="text-brand text-lg shrink-0">✓</span>}
						</button>
					);
				})}

				{/* Create new */}
				<button
					type="button"
					onClick={() => onResolve(pm.rawName, "NEW")}
					className={[
						"flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left w-full transition-all duration-150",
						resolution === "NEW"
							? "border-blue-400 bg-blue-950/40"
							: "border-line bg-surface-2 hover:border-blue-800/50",
					].join(" ")}
				>
					<div
						className={[
							"w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all",
							resolution === "NEW" ? "border-blue-600 bg-blue-600" : "border-line bg-surface",
						].join(" ")}
					>
						{resolution === "NEW" && <div className="w-1.5 h-1.5 rounded-full bg-surface" />}
					</div>
					<span
						className={[
							"text-sm font-semibold",
							resolution === "NEW" ? "text-blue-300" : "text-ink-2",
						].join(" ")}
					>
						+ Es un jugador nuevo — crear perfil
					</span>
					{resolution === "NEW" && (
						<span className="text-blue-500 text-lg ml-auto shrink-0">✓</span>
					)}
				</button>
			</div>
		</div>
	);
}

// ── Componente principal ──────────────────────────────────────────────────
export default function ImportPage() {
	// ── Estado (idéntico al original) ────────────────────────────────────
	const [step, setStep] = useState<Step>("upload");
	const [leagueId, setLeagueId] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [importType, setImportType] = useState<"goleadores" | "standings">("goleadores");
	const [jornada, setJornada] = useState("");

	const [sheets, setSheets] = useState<string[]>([]);
	const [activeSheet, setActiveSheet] = useState("");
	const [excelPreview, setExcelPreview] = useState<string[][]>([]);
	const [headerRow, setHeaderRow] = useState(0);

	const [columnMap, setColumnMap] = useState<Record<string, string>>({});

	const [templates, setTemplates] = useState<ImportTemplate[]>([]);
	const [selectedTemplate, setSelectedTemplate] = useState("");
	const [newTemplateName, setNewTemplateName] = useState("");
	const [savingTemplate, setSavingTemplate] = useState(false);
	const [templateSaved, setTemplateSaved] = useState(false);

	const [preview, setPreview] = useState<BulkPreview | null>(null);
	const [excludedRows, setExcludedRows] = useState<Set<string>>(new Set());
	const [resolutions, setResolutions] = useState<Record<string, string>>({});
	const [result, setResult] = useState<ImportResult | null>(null);
	const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Extra state for new drag-drop UI
	const [dragOver, setDragOver] = useState(false);
	// For visual column mapping: which field is being assigned
	const [activeMapField, setActiveMapField] = useState<string | null>(null);
	// Whether the user has clicked at least one field (shows tutorial until first interaction)
	const [hasMapInteracted, setHasMapInteracted] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/immutability
		loadTemplates();
	}, []);

	useEffect(() => {
		if (step !== "map" || excelPreview.length === 0 || selectedTemplate) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setColumnMap(autoMapColumns(excelPreview[headerRow] ?? [], importType));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [headerRow]);

	// ── Handlers (idénticos al original) ─────────────────────────────────
	async function loadTemplates() {
		const res = await fetch("/api/import/templates");
		if (res.ok) setTemplates((await res.json()).data ?? []);
	}

	async function handleDetect() {
		if (!file || !leagueId) {
			setError("Selecciona una liga y un archivo.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			if (activeSheet) fd.append("sheet", activeSheet);
			const res = await fetch("/api/import/detect", { method: "POST", body: fd });
			const data = await res.json();
			if (!data.ok) {
				setError(data.error);
				return;
			}
			setSheets(data.data.sheets);
			setActiveSheet(data.data.activeSheet);
			setExcelPreview(data.data.preview);
			const hRow = guessHeaderRow(data.data.preview);
			setHeaderRow(hRow);
			setColumnMap(autoMapColumns(data.data.preview[hRow] ?? [], importType));
			setActiveMapField(null);
			setStep("map");
		} finally {
			setLoading(false);
		}
	}

	async function handleSheetChange(sheet: string) {
		setActiveSheet(sheet);
		setColumnMap({});
		if (!file) return;
		setLoading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("sheet", sheet);
			const res = await fetch("/api/import/detect", { method: "POST", body: fd });
			const data = await res.json();
			if (data.ok) {
				setExcelPreview(data.data.preview);
				const hRow = guessHeaderRow(data.data.preview);
				setHeaderRow(hRow);
				setColumnMap(autoMapColumns(data.data.preview[hRow] ?? [], importType));
			}
		} finally {
			setLoading(false);
		}
	}

	function applyTemplate(templateId: string) {
		const t = templates.find((t) => t.id === templateId);
		if (!t) return;
		setSelectedTemplate(templateId);
		setImportType(t.type);
		setHeaderRow(t.headerRow);
		try {
			setColumnMap(JSON.parse(t.columnMap));
		} catch {
			/* ignore */
		}
	}

	async function handlePreview() {
		const requiredFields = importType === "goleadores" ? GOLEADORES_FIELDS : STANDINGS_FIELDS;
		const missing = requiredFields.filter((f) => f.required && !columnMap[f.key]);
		if (missing.length > 0) {
			setError(`Faltan columnas requeridas: ${missing.map((f) => f.label).join(", ")}`);
			return;
		}
		if (!leagueId.trim()) {
			setError("Falta el ID de liga.");
			return;
		}
		if (importType === "goleadores" && !jornada.trim()) {
			setError(
				"El número de jornada es obligatorio para registrar el historial y calcular posiciones ganadas/perdidas.",
			);
			return;
		}
		setError("");
		setLoading(true);
		try {
			const fd = new FormData();
			fd.append("file", file!);
			fd.append("league_id", leagueId.trim());
			fd.append("action", "preview");
			fd.append(
				"mapping",
				JSON.stringify({
					type: importType,
					sheetName: activeSheet,
					headerRow,
					columnMap,
					jornada: jornada ? parseInt(jornada) : undefined,
				}),
			);
			const res = await fetch("/api/import/bulk", { method: "POST", body: fd });
			const data = await res.json();
			if (!data.ok) {
				setError(data.error);
				return;
			}
			setPreview(data.data);
			setExcludedRows(new Set());
			if (data.data.type === "goleadores" && data.data.playerResolutions) {
				const auto: Record<string, string> = {};
				for (const pm of data.data.playerResolutions as PlayerResolution[]) {
					if (pm.found && pm.playerId) auto[pm.rawName] = pm.playerId;
					else if (!pm.found && pm.candidates.length === 0) auto[pm.rawName] = "NEW";
				}
				setResolutions(auto);
			}
			setStep("preview");
		} finally {
			setLoading(false);
		}
	}

	async function handleSaveTemplate() {
		if (!newTemplateName.trim()) return;
		setSavingTemplate(true);
		try {
			const res = await fetch("/api/import/templates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newTemplateName, type: importType, headerRow, columnMap }),
			});
			if (res.ok) {
				setNewTemplateName("");
				setTemplateSaved(true);
				await loadTemplates();
			}
		} finally {
			setSavingTemplate(false);
		}
	}

	async function handleConfirm() {
		if (preview?.type === "goleadores" && preview.playerResolutions) {
			const unresolved = preview.playerResolutions.filter(
				(p) => !p.found && p.candidates.length > 0 && !resolutions[p.rawName],
			);
			if (unresolved.length > 0) {
				setError(
					`Selecciona el jugador correcto para: ${unresolved.map((p) => p.rawName).join(", ")}`,
				);
				return;
			}
		}
		setLoading(true);
		setError("");
		try {
			const fd = new FormData();
			fd.append("file", file!);
			fd.append("league_id", leagueId.trim());
			fd.append("action", "confirm");
			fd.append(
				"mapping",
				JSON.stringify({
					type: importType,
					sheetName: activeSheet,
					headerRow,
					columnMap,
					jornada: jornada ? parseInt(jornada) : undefined,
				}),
			);
			if (preview?.type === "goleadores") fd.append("resolutions", JSON.stringify(resolutions));
			if (excludedRows.size > 0) fd.append("exclude_rows", JSON.stringify([...excludedRows]));
			const res = await fetch("/api/import/bulk", { method: "POST", body: fd });
			const data = await res.json();
			if (!data.ok) {
				setError(data.error);
				return;
			}
			setResult(data.data);
			setStep("done");
		} finally {
			setLoading(false);
		}
	}

	function reset() {
		setStep("upload");
		setFile(null);
		setPreview(null);
		setResult(null);
		setError("");
		setColumnMap({});
		setExcelPreview([]);
		setSelectedTemplate("");
		setJornada("");
		setExcludedRows(new Set());
		setTemplateSaved(false);
		setActiveMapField(null);
	}

	// ── Derived values ───────────────────────────────────────────────────
	const headerCols = excelPreview[headerRow] ?? [];
	const fields = importType === "goleadores" ? GOLEADORES_FIELDS : STANDINGS_FIELDS;
	const mappedCount = Object.keys(columnMap).length;
	const reqMapped = fields.filter((f) => f.required && columnMap[f.key] !== undefined).length;
	const allReqDone = reqMapped === fields.filter((f) => f.required).length;

	// Detect if selected header row looks bad (all same, or clearly data not headers)
	const allSameCols = headerCols.length > 1 && headerCols.every((c) => c === headerCols[0]);
	const hasGoodHeaders =
		headerCols.length === 0 || (!allSameCols && headerCols.some((c) => c && c !== headerCols[0]));

	const relevantTemplates = templates.filter((t) => t.type === importType);

	// Goleadores preview derived
	const ambiguous = (preview?.playerResolutions ?? []).filter(
		(p) => !p.found && p.candidates.length > 0,
	);
	const confirmed = (preview?.playerResolutions ?? []).filter((p) => p.found);
	const newPlayers = (preview?.playerResolutions ?? []).filter(
		(p) => !p.found && p.candidates.length === 0,
	);
	const pendingCount = ambiguous.filter((p) => !resolutions[p.rawName]).length;
	const allResolved = pendingCount === 0;

	// ── Column click handler for visual mapping ──────────────────────────
	function handleColClick(colIdx: number) {
		if (!activeMapField) return;
		const newMap = { ...columnMap };
		// Remove any previous assignment to this col index
		Object.entries(newMap).forEach(([k, v]) => {
			if (v === String(colIdx)) delete newMap[k];
		});
		newMap[activeMapField] = String(colIdx);
		setColumnMap(newMap);
		if (!hasMapInteracted) setHasMapInteracted(true);
		// Auto-advance to next unmapped required field
		const nextReq = fields.find((f) => f.required && !newMap[f.key] && f.key !== activeMapField);
		const nextAny = fields.find((f) => !newMap[f.key] && f.key !== activeMapField);
		setActiveMapField(nextReq?.key ?? nextAny?.key ?? null);
	}

	function handleMapFieldClick(fieldKey: string) {
		setActiveMapField(activeMapField === fieldKey ? null : fieldKey);
		if (!hasMapInteracted) setHasMapInteracted(true);
	}

	const getColName = (fieldKey: string) => {
		const idx = columnMap[fieldKey];
		return idx !== undefined ? (headerCols[parseInt(idx)] ?? `Col ${idx}`) : null;
	};

	// ── Render ───────────────────────────────────────────────────────────
	return (
		<div className="max-w-3xl mx-auto">
			{/* Page header */}
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

			<StepBar current={step} />

			{/* ─────────────────────────────────────────────────────────────
			    PASO 1: Subir archivo
			───────────────────────────────────────────────────────────── */}
			{step === "upload" && (
				<div className="flex flex-col gap-5">
					{/* Template suggestion banner */}
					{relevantTemplates.length > 0 && (
						<div className="rounded-2xl border border-brand/20 bg-brand/10 p-4 flex items-center gap-3">
							<span className="text-2xl shrink-0">💾</span>
							<div className="flex-1">
								<p className="text-sm font-semibold text-brand">
									¿Usar configuración guardada?
								</p>
								<div className="flex gap-2 mt-2 flex-wrap">
									{relevantTemplates.map((t) => (
										<button
											key={t.id}
											type="button"
											onClick={() => applyTemplate(t.id)}
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

						{/* Liga */}
						<div>
							<label className="block text-sm font-semibold text-ink mb-1.5">
								Liga <span className="text-red-500">*</span>
							</label>
							<LeagueSelect value={leagueId} onChange={setLeagueId} />
						</div>

						{/* Tipo de datos */}
						<div>
							<label className="block text-sm font-semibold text-ink mb-2">
								Tipo de datos
							</label>
							<div className="grid grid-cols-2 gap-3">
								{(["goleadores", "standings"] as const).map((t) => (
									<button
										key={t}
										type="button"
										onClick={() => {
											setImportType(t);
											setSelectedTemplate("");
										}}
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
											{t === "goleadores"
												? "Estadísticas de jugadores"
												: "Clasificación de equipos"}
										</div>
									</button>
								))}
							</div>
						</div>

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
									onClick={() => setJornada((j) => String(Math.max(1, (parseInt(j) || 1) - 1)))}
									className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-xl font-bold text-ink-2 hover:border-line transition shrink-0"
								>
									−
								</button>
								<input
									type="number"
									min="1"
									value={jornada}
									onChange={(e) => setJornada(String(Math.max(1, parseInt(e.target.value) || 1)))}
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
									onClick={() => setJornada((j) => String((parseInt(j) || 0) + 1))}
									className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-xl font-bold text-ink-2 hover:border-line transition shrink-0"
								>
									+
								</button>
								<span className="text-sm text-ink-3 hidden sm:inline">de la temporada</span>
							</div>
						</div>

						{/* Drag & Drop */}
						<div>
							<label className="block text-sm font-semibold text-ink mb-2">
								Archivo Excel
							</label>
							<div
								role="button"
								tabIndex={0}
								onDragOver={(e: DragEvent) => {
									e.preventDefault();
									setDragOver(true);
								}}
								onDragLeave={() => setDragOver(false)}
								onDrop={(e: DragEvent) => {
									e.preventDefault();
									setDragOver(false);
									const f = e.dataTransfer.files[0];
									if (f) {
										setFile(f);
										setSelectedTemplate("");
									}
								}}
								onClick={() => fileInputRef.current?.click()}
								onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
								className={[
									"rounded-2xl border-[2.5px] p-7 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-green-500",
									file
										? "border-brand border-solid bg-brand/10"
										: dragOver
											? "border-brand border-dashed bg-brand/10"
											: "border-line border-dashed hover:border-brand hover:bg-surface-2",
								].join(" ")}
							>
								{file ? (
									<div className="flex items-center justify-center gap-3">
										<span className="text-3xl">📄</span>
										<div className="text-left">
											<p className="text-[15px] font-bold text-brand">{file.name}</p>
											<p className="text-xs text-ink-2 mt-0.5">
												Archivo listo · Toca para cambiar
											</p>
										</div>
										<span className="text-2xl text-brand ml-2">✓</span>
									</div>
								) : (
									<div>
										<div className="text-4xl mb-2">📂</div>
										<p className="text-[15px] font-semibold text-ink mb-1">
											Arrastra tu archivo aquí
										</p>
										<p className="text-sm text-ink-3 mb-3">o haz clic para seleccionar</p>
										<span className="inline-block bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink">
											Seleccionar archivo .xlsx
										</span>
									</div>
								)}
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept=".xlsx,.xls"
								className="hidden"
								onChange={(e: ChangeEvent<HTMLInputElement>) => {
									const f = e.target.files?.[0];
									if (f) {
										setFile(f);
										setSelectedTemplate("");
									}
								}}
							/>
							<div className="flex items-center gap-2 mt-2">
								<span className="text-xs text-ink-3">¿No tienes el formato correcto?</span>
								<a
									href="/api/import/templates/example"
									className="text-xs text-blue-300 font-semibold underline"
									download
								>
									Descargar formato de ejemplo
								</a>
							</div>
						</div>
					</div>

					{error && (
						<p className="text-red-600 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2.5 rounded-xl">
							{error}
						</p>
					)}

					<button
						type="button"
						onClick={handleDetect}
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
			)}

			{/* ─────────────────────────────────────────────────────────────
			    PASO 2: Revisar columnas (mapeo visual)
			───────────────────────────────────────────────────────────── */}
			{step === "map" && (
				<div className="flex flex-col gap-5">
					{/* Hoja activa (solo si hay más de una) */}
					{sheets.length > 1 && (
						<div className="bg-surface rounded-2xl shadow-sm border border-line p-4 flex items-center gap-3">
							<label className="text-sm font-semibold text-ink whitespace-nowrap">
								Hoja del Excel:
							</label>
							<select
								value={activeSheet}
								onChange={(e) => handleSheetChange(e.target.value)}
								className="border border-line rounded-xl px-3 py-2 text-sm flex-1 bg-surface-2 text-ink [color-scheme:dark]"
							>
								{sheets.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
					)}

					{/* ── HEADER ROW SELECTOR — always first, prominent ── */}
					<div
						className={[
							"rounded-2xl border-2 p-4 transition-all",
							!hasGoodHeaders ? "bg-red-950/40 border-red-800/50" : "bg-brand/10 border-brand/20",
						].join(" ")}
					>
						<div className="flex items-start gap-3 mb-3">
							<span className="text-2xl shrink-0">{!hasGoodHeaders ? "🔍" : "✅"}</span>
							<div>
								<p
									className={`text-[15px] font-bold ${!hasGoodHeaders ? "text-red-400" : "text-brand"}`}
								>
									{!hasGoodHeaders
										? "La fila seleccionada no parece tener encabezados — toca la fila correcta"
										: `Fila ${headerRow + 1} tiene los encabezados correctos ✓`}
								</p>
								<p
									className={`text-xs mt-0.5 ${!hasGoodHeaders ? "text-red-400" : "text-brand"}`}
								>
									{!hasGoodHeaders
										? "Los encabezados son los nombres de las columnas (Equipo, JJ, PTS…). Busca la fila que los tenga y tócala."
										: `${mappedCount} columnas detectadas automáticamente.`}
								</p>
							</div>
						</div>

						{/* Mini Excel preview — rows as clickable buttons */}
						<div className="bg-surface rounded-xl border border-line overflow-hidden">
							<div className="px-3 py-2 bg-surface-2 border-b border-line text-[11px] font-bold text-ink-2 uppercase tracking-wider">
								Vista de tu archivo — toca la fila correcta
							</div>
							{/* Scroll wrapper: allows horizontal scroll on mobile */}
							<div className="overflow-x-auto">
								{excelPreview.slice(0, 5).map((row, ri) => {
									const isSelected = ri === headerRow;
									const looksLikeHeaders = row.some(
										(c) =>
											c && isNaN(Number(c)) && c.length > 0 && new Set(row.filter(Boolean)).size > 1,
									);
									return (
										<button
											key={ri}
											type="button"
											onClick={() => {
												setHeaderRow(ri);
												setColumnMap(autoMapColumns(row, importType));
												setActiveMapField(null);
												setHasMapInteracted(false);
											}}
											className={[
												"w-full min-w-[320px] flex items-center gap-0 text-left border-b border-line last:border-0 transition-colors",
												isSelected
													? "bg-brand/10 border-l-[3px] border-l-green-500"
													: "hover:bg-blue-950/40/40 border-l-[3px] border-l-transparent",
											].join(" ")}
										>
											{/* Row number */}
											<div
												className={`w-9 py-2 text-center text-[11px] font-bold shrink-0 border-r border-line ${isSelected ? "text-brand bg-brand/15" : "text-ink-3 bg-surface-2"}`}
											>
												{isSelected ? "★" : ri + 1}
											</div>
											{/* Cell previews — fixed width per cell so they don't squish */}
											<div className="flex px-1">
												{row.slice(0, 6).map((cell, ci) => (
													<div
														key={ci}
														className={`px-2 py-2 text-[12px] truncate w-24 shrink-0 ${isSelected ? "text-brand font-semibold" : looksLikeHeaders ? "text-ink font-semibold" : "text-ink-3"}`}
													>
														{cell || "—"}
													</div>
												))}
												{row.length > 6 && (
													<div className="px-2 py-2 text-[11px] text-ink-3 shrink-0 self-center">
														+{row.length - 6}
													</div>
												)}
											</div>
											{/* Badge */}
											<div className="ml-auto px-3 shrink-0">
												{isSelected ? (
													<span className="text-[11px] bg-brand/15 text-brand px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
														✓
													</span>
												) : looksLikeHeaders ? (
													<span className="text-[11px] bg-yellow-100 text-yellow-300 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
														↑
													</span>
												) : null}
											</div>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* ── Progress / how-it-works banner — only once headers look good ── */}
					{hasGoodHeaders && (
						<div
							className={[
								"rounded-2xl border-2 p-4 flex gap-3 items-start transition-all",
								hasMapInteracted ? "bg-brand/10 border-brand/20" : "bg-blue-950/40 border-blue-800/50",
							].join(" ")}
						>
							<span className="text-2xl shrink-0">{hasMapInteracted ? "✅" : "👋"}</span>
							<div className="flex-1 min-w-0">
								<p
									className={`text-[14px] font-bold mb-1 ${hasMapInteracted ? "text-brand" : "text-blue-300"}`}
								>
									{hasMapInteracted
										? `${mappedCount} de ${fields.length} columnas asignadas`
										: `Detectamos ${mappedCount} columnas — revisa y corrige si algo está mal`}
								</p>
								{!hasMapInteracted && (
									<p className="text-[12px] text-blue-300 mt-1">
										① Toca un campo → ② toca su columna → ✅ listo
									</p>
								)}
								{hasMapInteracted && !allReqDone && (
									<p className="text-xs text-orange-700 mt-1">
										Faltan:{" "}
										{fields
											.filter((f) => f.required && !columnMap[f.key])
											.map((f) => f.label)
											.join(", ")}
									</p>
								)}
								{hasMapInteracted && allReqDone && (
									<p className="text-xs text-brand mt-1">
										Todos los campos obligatorios asignados. ¡Puedes continuar!
									</p>
								)}
							</div>
							{hasMapInteracted && (
								<div className="shrink-0 text-center w-12">
									<div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1">
										<div
											className="h-full bg-brand/100 rounded-full transition-all duration-500"
											style={{ width: `${(mappedCount / fields.length) * 100}%` }}
										/>
									</div>
									<span className="text-[10px] text-ink-2">
										{mappedCount}/{fields.length}
									</span>
								</div>
							)}
						</div>
					)}

					{/* ── Two-panel mapping — only when headers look good ── */}
					{hasGoodHeaders && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Left: Fields */}
							<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
								<div className="px-4 py-3 border-b border-line">
									<h3 className="text-[14px] font-bold text-ink">
										{activeMapField
											? `✏️ Asignando: ${fields.find((f) => f.key === activeMapField)?.label}`
											: "① Toca un campo para asignarlo"}
									</h3>
								</div>
								<div className="p-3 flex flex-col gap-1.5">
									{fields.map((f) => {
										const colName = getColName(f.key);
										const isMapped = colName !== null;
										const isActive = activeMapField === f.key;
										const isReqFail = f.required && !isMapped && !isActive;
										return (
											<button
												key={f.key}
												type="button"
												onClick={() => handleMapFieldClick(f.key)}
												className={[
													"flex items-center justify-between w-full px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
													isMapped ? "border-brand/40 bg-surface-2 text-ink" : "",
													isActive
														? "border-blue-400 bg-blue-950/40 text-blue-300 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
														: "",
													isReqFail ? "border-orange-800/50 bg-orange-950/30 text-orange-300" : "",
													!isMapped && !isActive && !isReqFail
														? "border-line bg-surface-2 text-ink-2 hover:border-blue-800/50 hover:bg-blue-950/40/40"
														: "",
												].join(" ")}
											>
												<div className="flex items-center gap-2 min-w-0">
													<span className="text-base shrink-0">
														{isMapped ? "✅" : isActive ? "👆" : isReqFail ? "⚠️" : "○"}
													</span>
													<span className="truncate">{f.label}</span>
													{f.required && (
														<span className="text-[10px] opacity-60 shrink-0">(req.)</span>
													)}
												</div>
												<div className="flex items-center gap-1.5 shrink-0 ml-2">
													{isMapped && (
														<span className="text-[11px] bg-brand/15 px-2 py-0.5 rounded-full font-bold border border-brand/30 text-brand">
															{colName}
														</span>
													)}
													{isActive && !isMapped && (
														<span className="text-[11px] italic text-blue-300">
															→ elige columna
														</span>
													)}
													{isMapped && (
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																const m = { ...columnMap };
																delete m[f.key];
																setColumnMap(m);
															}}
															className="opacity-40 hover:opacity-70 text-sm"
															title="Quitar"
														>
															×
														</button>
													)}
												</div>
											</button>
										);
									})}
								</div>
							</div>

							{/* Right: Excel columns */}
							<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
								<div className="px-4 py-3 border-b border-line">
									<h3
										className={`text-[14px] font-bold ${activeMapField ? "text-blue-300" : "text-ink"}`}
									>
										{activeMapField
											? `② ¿Cuál columna es "${fields.find((f) => f.key === activeMapField)?.label}"?`
											: "② Columnas de tu archivo"}
									</h3>
									{!activeMapField && (
										<p className="text-[11px] text-ink-3 mt-0.5">
											Selecciona un campo a la izquierda primero
										</p>
									)}
								</div>
								<div className="p-3 flex flex-col gap-1.5">
									{headerCols.map((col, idx) => {
										const assignedKey = Object.entries(columnMap).find(
											([, v]) => v === String(idx),
										)?.[0];
										const assignedLabel = assignedKey
											? fields.find((f) => f.key === assignedKey)?.label
											: null;
										const isMapped = !!assignedLabel;
										const isClickable = !!activeMapField;
										return (
											<div
												key={idx}
												role={isClickable ? "button" : undefined}
												tabIndex={isClickable ? 0 : undefined}
												onClick={() => handleColClick(idx)}
												onKeyDown={(e) => e.key === "Enter" && handleColClick(idx)}
												className={[
													"flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all",
													isMapped ? "border-brand/40 bg-surface-2" : "",
													!isMapped && isClickable
														? "border-blue-800/50 bg-blue-950/40 cursor-pointer hover:border-blue-500 hover:shadow-sm"
														: "",
													!isMapped && !isClickable ? "border-line bg-surface-2 opacity-50" : "",
												].join(" ")}
											>
												<div className="flex items-center gap-2">
													<span
														className="text-[12px] font-black min-w-[18px]"
														style={{
															fontFamily: "'Barlow Condensed', sans-serif",
															color: isMapped ? "var(--color-brand)" : isClickable ? "#60a5fa" : "#555555",
														}}
													>
														{idx + 1}
													</span>
													<span
														className={`text-[14px] font-bold text-ink`}
													>
														{col || "(vacío)"}
													</span>
												</div>
												{isMapped ? (
													<span className="text-[11px] bg-brand/15 text-brand px-2 py-0.5 rounded-full font-semibold">
														✓ {assignedLabel}
													</span>
												) : isClickable ? (
													<span className="text-[11px] text-blue-300 font-bold">Seleccionar →</span>
												) : null}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}

					{/* Save as template */}
					{hasGoodHeaders && (
						<div className="bg-surface-2 border border-line rounded-2xl p-4">
							<p className="text-[13px] text-white font-semibold text-ink-2 mb-2">
								💾 Guardar esta configuración para la próxima vez
							</p>
							{templateSaved ? (
								<div className="flex items-center gap-2 text-brand text-sm font-semibold">
									<span>✅</span> ¡Plantilla guardada!
								</div>
							) : (
								<div className="flex gap-2">
									<input
										value={newTemplateName}
										onChange={(e) => setNewTemplateName(e.target.value)}
										placeholder="Ej: Liga Viernes – Posiciones"
										className="flex-1 border border-line rounded-xl px-3 py-2 text-sm outline-none focus:border-brand"
									/>
									<button
										type="button"
										onClick={handleSaveTemplate}
										disabled={savingTemplate || !newTemplateName.trim()}
										className={[
											"px-4 py-2 rounded-xl text-sm font-semibold text-white transition",
											newTemplateName.trim()
												? "bg-surface-2 hover:bg-surface"
												: "bg-line cursor-not-allowed",
										].join(" ")}
									>
										{savingTemplate ? "..." : "Guardar"}
									</button>
								</div>
							)}
						</div>
					)}

					{error && (
						<p className="text-red-600 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2.5 rounded-xl">
							{error}
						</p>
					)}

					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => {
								setStep("upload");
								setError("");
							}}
							className="bg-surface border border-line text-ink px-5 py-3.5 rounded-2xl text-[15px] font-semibold hover:bg-surface-2 transition"
						>
							← Atrás
						</button>
						<button
							type="button"
							onClick={handlePreview}
							disabled={loading || !allReqDone || !hasGoodHeaders}
							className={[
								"flex-1 py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all",
								allReqDone && hasGoodHeaders && !loading
									? "bg-brand hover:bg-brand-dim shadow-[0_4px_12px_rgba(22,163,74,0.35)]"
									: "bg-line cursor-not-allowed",
							].join(" ")}
						>
							{loading ? (
								<>
									<span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Procesando...
								</>
							) : !hasGoodHeaders ? (
								<>Selecciona la fila de encabezados primero</>
							) : (
								<>Ver datos importados →</>
							)}
						</button>
					</div>
				</div>
			)}

			{/* ─────────────────────────────────────────────────────────────
			    PASO 3: Vista previa
			───────────────────────────────────────────────────────────── */}
			{step === "preview" && preview && (
				<div className="flex flex-col gap-5">
					{/* ── GOLEADORES ── */}
					{preview.type === "goleadores" && (
						<>
							{/* Dynamic summary banner */}
							<div
								className={[
									"rounded-2xl border p-4 flex items-center gap-4 flex-wrap transition-all duration-300",
									allResolved ? "bg-brand/10 border-brand/20" : "bg-orange-50 border-orange-200",
								].join(" ")}
							>
								<span className="text-3xl shrink-0">{allResolved ? "✅" : "⚠️"}</span>
								<div className="flex-1">
									<p
										className={`text-base font-bold ${allResolved ? "text-brand" : "text-orange-800"}`}
									>
										{allResolved
											? `¡Todo listo! ${preview.summary.players ?? 0} jugadores · ${preview.summary.totalGoals ?? 0} goles — Jornada ${preview.jornada}`
											: `Identifica ${pendingCount} jugador${pendingCount !== 1 ? "es" : ""} antes de importar`}
									</p>
									<p
										className={`text-xs mt-0.5 ${allResolved ? "text-brand" : "text-orange-700"}`}
									>
										{allResolved
											? `Todo el mapeo está completo y listo para guardar.`
											: `${ambiguous.length - pendingCount} de ${ambiguous.length} jugadores ambiguos identificados`}
									</p>
								</div>
								{/* Mini stats */}
								<div className="flex gap-4 shrink-0 w-full sm:w-auto justify-around sm:justify-start">
									{[
										{
											label: "Jugadores",
											value: preview.summary.players ?? 0,
											color: "text-brand",
										},
										{
											label: "Goles",
											value: preview.summary.totalGoals ?? 0,
											color: "text-brand",
										},
										{
											label: "Pendientes",
											value: pendingCount,
											color: pendingCount > 0 ? "text-orange-700" : "text-ink-3",
										},
									].map((s) => (
										<div key={s.label} className="text-center">
											<div
												className={`text-[22px] font-black leading-tight ${s.color}`}
												style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
											>
												{s.value}
											</div>
											<div className="text-[10px] text-ink-3 uppercase tracking-wider">
												{s.label}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Anomaly reports */}
							{preview.anomalyReports &&
								(() => {
									const critical = preview.anomalyReports!.filter((r) => r.level === "critical");
									const warned = preview.anomalyReports!.filter((r) => r.level === "warning");
									if (critical.length === 0 && warned.length === 0) return null;
									return (
										<div className="flex flex-col gap-3">
											<div
												className={[
													"flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border",
													critical.length > 0
														? "bg-red-950/40 border-red-800/50 text-red-400"
														: "bg-amber-50 border-amber-200 text-amber-800",
												].join(" ")}
											>
												<span>{critical.length > 0 ? "🚨" : "⚠️"}</span>
												<span>
													{critical.length > 0 &&
														`${critical.length} anomalía${critical.length !== 1 ? "s" : ""} crítica${critical.length !== 1 ? "s" : ""}`}
													{critical.length > 0 && warned.length > 0 && " · "}
													{warned.length > 0 &&
														`${warned.length} aviso${warned.length !== 1 ? "s" : ""}`}
													{" — Revisa antes de importar"}
												</span>
											</div>
											{critical.map((r) => (
												<div
													key={r.rawName}
													className="bg-red-950/40 border-2 border-red-800/50 rounded-2xl p-4"
												>
													<div className="flex items-center gap-2 mb-2">
														<span className="font-bold text-red-400 text-sm">{r.rawName}</span>
														<span className="ml-auto text-xs font-bold uppercase tracking-wide bg-red-200 text-red-400 px-2 py-0.5 rounded-full">
															Crítico
														</span>
													</div>
													<ul className="space-y-1">
														{r.flags.map((f, i) => (
															<li key={i} className="text-xs text-red-400 flex items-start gap-1.5">
																<span className="shrink-0 mt-0.5">•</span>
																<span>{f.message}</span>
															</li>
														))}
													</ul>
												</div>
											))}
											{warned.length > 0 && (
												<details className="bg-amber-50 border border-amber-200 rounded-2xl group">
													<summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-amber-800 select-none list-none flex items-center gap-2">
														<span>⚠️</span>
														{warned.length === 1 ? "1 aviso" : `${warned.length} avisos`} — puede
														ser normal
														<span className="ml-auto text-xs text-amber-600 group-open:hidden">
															Ver ▼
														</span>
														<span className="ml-auto text-xs text-amber-600 hidden group-open:inline">
															Ocultar ▲
														</span>
													</summary>
													<div className="px-4 pb-4 pt-2 border-t border-amber-200 space-y-3">
														{warned.map((r) => (
															<div key={r.rawName}>
																<p className="text-xs font-bold text-amber-900 mb-1">{r.rawName}</p>
																<ul className="space-y-0.5">
																	{r.flags.map((f, i) => (
																		<li
																			key={i}
																			className="text-xs text-amber-700 flex items-start gap-1.5"
																		>
																			<span className="shrink-0">•</span>
																			<span>{f.message}</span>
																		</li>
																	))}
																</ul>
															</div>
														))}
													</div>
												</details>
											)}
										</div>
									);
								})()}

							{/* Ambiguous players */}
							{ambiguous.length > 0 && (
								<div className="flex flex-col gap-3">
									<div className="flex items-center gap-3">
										<div className="flex-1 h-px bg-surface-2" />
										<span className="text-xs font-bold text-ink-2 uppercase tracking-wider whitespace-nowrap px-2">
											{ambiguous.filter((p) => !!resolutions[p.rawName]).length}/{ambiguous.length}{" "}
											identificados
										</span>
										<div className="flex-1 h-px bg-surface-2" />
									</div>
									{ambiguous.map((pm) => (
										<PlayerResolutionCard
											key={pm.rawName}
											pm={pm}
											resolution={resolutions[pm.rawName] ?? ""}
											onResolve={(rawName, id) =>
												setResolutions((prev) => ({ ...prev, [rawName]: id }))
											}
										/>
									))}
								</div>
							)}

							{/* New players */}
							{newPlayers.length > 0 && (
								<div className="bg-blue-950/40 border border-blue-800/50 rounded-2xl p-4">
									<div className="flex items-center gap-2 mb-3">
										<span className="text-base">🆕</span>
										<p className="text-sm font-bold text-blue-300">
											{newPlayers.length === 1
												? "1 jugador nuevo"
												: `${newPlayers.length} jugadores nuevos`}{" "}
											— se crearán automáticamente
										</p>
									</div>
									<div className="flex flex-col gap-1.5">
										{newPlayers.map((pm) => (
											<div
												key={pm.rawName}
												className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2"
											>
												<span className="text-blue-500 text-sm">•</span>
												<span className="text-sm font-semibold text-ink flex-1">
													{pm.rawName}
												</span>
												{pm.teamName && (
													<span className="text-xs text-ink-2">{pm.teamName}</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Confirmed (collapsible) */}
							{confirmed.length > 0 && (
								<details className="bg-surface border border-line rounded-2xl overflow-hidden group">
									<summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-ink-2 select-none list-none flex items-center gap-2">
										<span className="text-brand">✅</span>
										{confirmed.length === 1 ? "1 jugador" : `${confirmed.length} jugadores`}{" "}
										reconocidos automáticamente
										<span className="ml-auto text-xs text-ink-3 group-open:hidden">
											Ver lista ▾
										</span>
										<span className="ml-auto text-xs text-ink-3 hidden group-open:inline">
											Ocultar ▴
										</span>
									</summary>
									<div className="border-t border-line">
										{confirmed.map((pm) => (
											<div
												key={pm.rawName}
												className="flex items-center gap-2 px-4 py-2.5 border-b border-line last:border-0"
											>
												<span className="text-brand text-sm shrink-0">✓</span>
												<span className="text-sm font-semibold text-ink">{pm.rawName}</span>
												{pm.playerId && (
													<span className="text-xs text-ink-3 ml-1">identificado</span>
												)}
											</div>
										))}
									</div>
								</details>
							)}

							{/* Blocking message */}
							{pendingCount > 0 && (
								<div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 flex gap-2 items-center">
									<span className="text-lg shrink-0">🚫</span>
									<p className="text-sm text-red-400 font-medium">
										Identifica los {pendingCount} jugador{pendingCount !== 1 ? "es" : ""} marcados
										con ⚠️ arriba para poder importar.
									</p>
								</div>
							)}
						</>
					)}

					{/* ── POSICIONES ── */}
					{preview.type === "standings" && (
						<>
							<div className="bg-brand/10 border border-brand/20 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
								<span className="text-3xl">✅</span>
								<div className="flex-1">
									<p className="text-base font-bold text-brand">
										¡Todo se ve bien! {(preview.rows as StandingsRow[]).length} equipos para la
										Jornada {preview.jornada}
									</p>
									<p className="text-xs text-brand mt-0.5">
										{preview.summary.teams} equipos listos para importar.
									</p>
								</div>
								<div className="text-center shrink-0">
									<div
										className="text-2xl font-black text-brand"
										style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
									>
										{preview.summary.teams}
									</div>
									<div className="text-[10px] text-ink-3 uppercase tracking-wider">Equipos</div>
								</div>
							</div>

							{/* Warnings */}
							{preview.warnings.length > 0 && (
								<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-2xl p-4">
									<p className="font-semibold text-yellow-300 text-sm mb-2">Avisos</p>
									<ul className="space-y-1">
										{preview.warnings.map((w, i) => (
											<li key={i} className="text-xs text-yellow-300">
												⚠ {w}
											</li>
										))}
									</ul>
								</div>
							)}

							{/* Table */}
							<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
								<div className="px-4 py-3 border-b border-line flex items-center justify-between">
									<h3 className="text-sm font-bold text-ink">Vista previa de los datos</h3>
									{excludedRows.size > 0 && (
										<button
											type="button"
											onClick={() => setExcludedRows(new Set())}
											className="text-xs text-ink-2 bg-surface-2 rounded-lg px-3 py-1 hover:bg-surface-2 transition"
										>
											Restaurar todos
										</button>
									)}
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="bg-surface-2">
											<tr>
												{["#", "Equipo", "JJ", "G", "E", "P", "GF", "GC", "Pts", ""].map((h, i) => (
													<th
														key={i}
														className={`px-3 py-2.5 text-[11px] font-bold text-ink-2 uppercase tracking-wider whitespace-nowrap ${i <= 1 ? "text-left" : "text-center"}`}
													>
														{h}
													</th>
												))}
											</tr>
										</thead>
										<tbody className="divide-y divide-line">
											{(preview.rows as StandingsRow[]).map((r, i) => {
												const key = `s:${i}:${r.teamName}`;
												const excluded = excludedRows.has(key);
												return (
													<tr
														key={r.teamName}
														className={`transition-opacity ${excluded ? "opacity-40 bg-red-950/40" : i % 2 === 0 ? "bg-surface" : "bg-surface-2/50"}`}
													>
														<td className="px-3 py-2.5 text-ink-3 text-xs">{r.position}</td>
														<td
															className={`px-3 py-2.5 font-semibold text-ink ${excluded ? "line-through" : ""}`}
														>
															{r.teamName}
														</td>
														<td className="px-3 py-2.5 text-center text-ink-2">{r.played}</td>
														<td className="px-3 py-2.5 text-center font-semibold text-brand">
															{r.wins}
														</td>
														<td className="px-3 py-2.5 text-center text-ink-2">{r.draws}</td>
														<td className="px-3 py-2.5 text-center text-red-500">{r.losses}</td>
														<td className="px-3 py-2.5 text-center text-ink-2">{r.goalsFor}</td>
														<td className="px-3 py-2.5 text-center text-ink-2">
															{r.goalsAgainst}
														</td>
														<td
															className="px-3 py-2.5 text-center font-black text-brand text-base"
															style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
														>
															{r.points}
														</td>
														<td className="px-2 py-2.5 text-center">
															<button
																type="button"
																onClick={() =>
																	setExcludedRows((prev) => {
																		const next = new Set(prev);
																		excluded ? next.delete(key) : next.add(key);
																		return next;
																	})
																}
																title={excluded ? "Restaurar" : "Excluir fila"}
																className="text-ink-2 hover:text-red-500 transition text-base leading-none"
															>
																{excluded ? "↩" : "✕"}
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>

							{excludedRows.size > 0 && (
								<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-xl px-4 py-2.5 text-sm text-yellow-300">
									⚠️ {excludedRows.size} equipo{excludedRows.size !== 1 ? "s" : ""} excluido
									{excludedRows.size !== 1 ? "s" : ""} — no se importará
									{excludedRows.size !== 1 ? "n" : ""}.
								</div>
							)}
						</>
					)}

					{error && (
						<p className="text-red-600 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2.5 rounded-xl">
							{error}
						</p>
					)}

					{/* Nav */}
					{(() => {
						const pendingAmbig =
							preview.type === "goleadores"
								? (preview.playerResolutions?.filter(
									(p) => !p.found && p.candidates.length > 0 && !resolutions[p.rawName],
								).length ?? 0)
								: 0;
						const canConfirm = pendingAmbig === 0;
						return (
							<div className="flex flex-col gap-3">
								{pendingAmbig > 0 && (
									<p className="text-orange-700 text-sm bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-xl">
										⚠️ Faltan {pendingAmbig} jugador{pendingAmbig !== 1 ? "es" : ""} por seleccionar
										arriba.
									</p>
								)}
								<div className="flex gap-3">
									<button
										type="button"
										onClick={() => {
											setStep("map");
											setError("");
										}}
										className="bg-surface border border-line text-ink px-5 py-3.5 rounded-2xl text-[15px] font-semibold hover:bg-surface-2 transition"
									>
										← Atrás
									</button>
									<button
										type="button"
										onClick={handleConfirm}
										disabled={loading || !canConfirm}
										className={[
											"flex-1 py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-300",
											canConfirm && !loading
												? "bg-brand hover:bg-brand-dim shadow-[0_4px_12px_rgba(22,163,74,0.35)]"
												: "bg-line cursor-not-allowed",
										].join(" ")}
									>
										{loading ? (
											<>
												<span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
												Importando...
											</>
										) : preview.type === "goleadores" ? (
											canConfirm ? (
												`Confirmar e importar ${preview.summary.players ?? 0} jugadores ✓`
											) : (
												`Identifica ${pendingAmbig} jugador${pendingAmbig !== 1 ? "es" : ""} primero`
											)
										) : (
											"Confirmar e importar ✓"
										)}
									</button>
								</div>
							</div>
						);
					})()}
				</div>
			)}

			{/* ─────────────────────────────────────────────────────────────
			    PASO 4: ¡Listo!
			───────────────────────────────────────────────────────────── */}
			{step === "done" && result && (
				<div className="flex flex-col gap-5">
					{/* Big success */}
					<div className="bg-brand/10 border-2 border-brand/20 rounded-3xl p-8 text-center">
						<div
							className="text-5xl mb-3"
							style={{ animation: "successBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
						>
							🎉
						</div>
						<h2
							className="text-2xl font-black text-brand mb-1"
							style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
						>
							¡Importación completada{result.content ? ` · Jornada ${result.content.jornada}` : ""}!
						</h2>
						<p className="text-sm text-brand mb-6">
							{result.upserted} registros actualizados
							{result.created > 0 ? ` · ${result.created} nuevos` : ""}
						</p>
						<div className="flex justify-center gap-8 mb-6">
							{[
								{ label: "Actualizados", value: result.upserted, icon: "✏️" },
								{ label: "Nuevos", value: result.created, icon: "🆕" },
							].map((s) => (
								<div key={s.label} className="text-center">
									<div className="text-base mb-1">{s.icon}</div>
									<div
										className="text-3xl font-black text-brand"
										style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
									>
										{s.value}
									</div>
									<div className="text-xs text-ink-2">{s.label}</div>
								</div>
							))}
						</div>
						<button
							type="button"
							onClick={reset}
							className="bg-brand hover:bg-brand-dim text-pitch px-6 py-3 rounded-2xl text-sm font-bold shadow-[0_4px_12px_rgba(22,163,74,0.4)] transition"
						>
							＋ Nueva importación
						</button>
					</div>

					{result.content && (
						<>
							{/* Download image */}
							<div className="bg-surface border border-line rounded-2xl p-5 flex items-center gap-4">
								<span className="text-3xl shrink-0">🖼️</span>
								<div className="flex-1">
									<h3 className="text-sm font-bold text-ink">Imagen de jornada lista</h3>
									<p className="text-xs text-ink-2 mt-0.5">
										1080×1080 · Lista para WhatsApp y Facebook
									</p>
								</div>
								<a
									href={result.content.imageUrl}
									download
									className="flex items-center gap-2 bg-surface hover:bg-surface-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shrink-0"
								>
									↓ Descargar
								</a>
							</div>

							{/* Pills */}
							{result.content.pills.length > 0 && (
								<div className="bg-surface border border-line rounded-2xl p-5">
									<h3 className="text-sm font-bold text-ink mb-1">Highlights de la jornada</h3>
									<p className="text-xs text-ink-3 mb-4">
										Toca para copiar y compartir en WhatsApp
									</p>
									<div className="flex flex-col gap-2">
										{result.content.pills.map((pill, i) => (
											<button
												key={i}
												type="button"
												onClick={() => {
													navigator.clipboard
														.writeText(`${pill.headline} — ${pill.detail}`)
														.then(() => {
															setCopiedIdx(i);
															setTimeout(() => setCopiedIdx(null), 1800);
														});
												}}
												className={[
													"flex items-start justify-between gap-3 p-3 rounded-xl border text-left transition-all",
													copiedIdx === i
														? "bg-brand/10 border-brand/20"
														: "bg-surface-2 border-line hover:bg-surface-2",
												].join(" ")}
											>
												<div className="min-w-0">
													<p className="text-sm font-bold text-ink leading-snug">
														{pill.headline}
													</p>
													<p className="text-xs text-ink-2 mt-0.5 leading-snug">{pill.detail}</p>
												</div>
												<span className="shrink-0 text-xs font-semibold text-ink-3 mt-0.5">
													{copiedIdx === i ? "✓ Copiado" : "📋"}
												</span>
											</button>
										))}
									</div>
								</div>
							)}
						</>
					)}

					{/* Warnings */}
					{result.warnings.length > 0 && (
						<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-2xl p-4">
							<p className="text-sm font-semibold text-yellow-300 mb-2">Avisos de la importación</p>
							<ul className="space-y-1">
								{result.warnings.map((w, i) => (
									<li key={i} className="text-xs text-yellow-300">
										⚠ {w}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ── Helpers (idénticos al original) ──────────────────────────────────────
function guessHeaderRow(preview: string[][]): number {
	let bestRow = 0,
		bestScore = 0;
	for (let i = 0; i < Math.min(preview.length, 8); i++) {
		const nonEmpty = preview[i].filter((c) => c !== "").length;
		if (nonEmpty > bestScore) {
			bestScore = nonEmpty;
			bestRow = i;
		}
	}
	return bestRow;
}

function norm(s: string): string {
	return s
		.toUpperCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();
}

function autoMapColumns(
	headerCols: string[],
	type: "goleadores" | "standings",
): Record<string, string> {
	const PATTERNS: Record<string, Record<string, string[]>> = {
		goleadores: {
			rawName: ["NOMBRE", "JUGADOR", "PLAYER", "NOMBRE DE JUGADOR", "NOMBRE DEL JUGADOR"],
			teamName: ["EQUIPO", "TEAM", "CLUB"],
			goals: ["GOLES", "GOL", "GOALS", "G"],
			assists: ["ASISTENCIAS", "ASISTENCIA", "AST", "ASSISTS", "A"],
			yellowCards: ["AMARILLAS", "AMARILLA", "YELLOW", "TA"],
			redCards: ["ROJAS", "ROJA", "RED", "TR"],
			matchesPlayed: ["PARTIDOS", "JJ", "PJ", "PLAYED", "MATCHES", "PARTIDOS JUGADOS"],
		},
		standings: {
			teamName: ["EQUIPO", "TEAM", "CLUB"],
			played: ["JJ", "PJ", "PARTIDOS JUGADOS", "PLAYED", "PARTIDOS"],
			wins: ["JG", "GANADOS", "WINS", "W", "VICTORIAS"],
			draws: ["JE", "EMPATES", "DRAWS", "D", "EMPATE"],
			losses: ["JP", "PERDIDOS", "LOSSES", "DERROTAS", "DERROTA"],
			goalsFor: ["GF", "GOLES A FAVOR", "GOALS FOR", "FAVOR"],
			goalsAgainst: ["GC", "GOLES EN CONTRA", "GOALS AGAINST", "CONTRA"],
			points: ["PTS", "PUNTOS", "POINTS", "PT"],
		},
	};
	const patterns = PATTERNS[type];
	const map: Record<string, string> = {};
	const usedCols = new Set<number>();
	for (const [field, keywords] of Object.entries(patterns)) {
		for (let ci = 0; ci < headerCols.length; ci++) {
			if (usedCols.has(ci)) continue;
			const cell = norm(headerCols[ci]);
			if (!cell) continue;
			const exactMatch = keywords.some((k) => norm(k) === cell);
			const partialMatch =
				!exactMatch && keywords.some((k) => cell.includes(norm(k)) || norm(k).includes(cell));
			if (exactMatch || partialMatch) {
				map[field] = String(ci);
				usedCols.add(ci);
				break;
			}
		}
	}
	return map;
}