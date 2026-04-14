"use client";

import { useState, useEffect } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────
type ImportTemplate = {
  id: string;
  name: string;
  type: "goleadores" | "standings";
  headerRow: number;
  columnMap: string; // JSON string
};

type PlayerResolution = {
  rawName: string;
  teamName: string;
  found: boolean;
  playerId?: string;
  candidates: { id: string; fullName: string; alias: string | null }[];
};

type GoleadoresRow = { rawName: string; teamName: string; goals: number };
type StandingsRow = {
  position: number; teamName: string; played: number; wins: number;
  draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number;
};

type BulkPreview = {
  type: "goleadores" | "standings";
  jornada?: number;
  rows: GoleadoresRow[] | StandingsRow[];
  playerResolutions?: PlayerResolution[];
  warnings: string[];
  summary: { players?: number; teams?: number; totalGoals?: number };
};

// Campos requeridos / opcionales por tipo
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

type Step = "upload" | "map" | "preview" | "done";

type League = { id: string; name: string; dayOfWeek: string; season: string };

// ── Componente principal ───────────────────────────────────────────────────
export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [leagueId, setLeagueId] = useState("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"goleadores" | "standings">("goleadores");
  const [jornada, setJornada] = useState("");

  // Detect
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [excelPreview, setExcelPreview] = useState<string[][]>([]);
  const [headerRow, setHeaderRow] = useState(0);

  // Column map: { fieldKey: columnIndex (string) }
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});

  // Templates
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Preview / confirm
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [excludedRows, setExcludedRows] = useState<Set<string>>(new Set());
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ upserted: number; created: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTemplates();
    loadLeagues();
  }, []);

  // Re-auto-mapear cuando el usuario cambia la fila de encabezados manualmente
  // (solo en step "map" y sin plantilla aplicada, para no pisar selecciones manuales)
  useEffect(() => {
    if (step !== "map" || excelPreview.length === 0 || selectedTemplate) return;
    setColumnMap(autoMapColumns(excelPreview[headerRow] ?? [], importType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerRow]);

  async function loadTemplates() {
    const res = await fetch("/api/import/templates");
    if (res.ok) setTemplates((await res.json()).data ?? []);
  }

  async function loadLeagues() {
    const res = await fetch("/api/leagues");
    if (res.ok) setLeagues((await res.json()).data ?? []);
  }

  // PASO 1: Subir archivo y detectar columnas
  async function handleDetect() {
    if (!file || !leagueId) { setError("Selecciona una liga y un archivo."); return; }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (activeSheet) fd.append("sheet", activeSheet);
      const res = await fetch("/api/import/detect", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }

      setSheets(data.data.sheets);
      setActiveSheet(data.data.activeSheet);
      setExcelPreview(data.data.preview);

      // Auto-detectar fila de encabezado: buscar la fila con más celdas no vacías
      const hRow = guessHeaderRow(data.data.preview);
      setHeaderRow(hRow);
      setColumnMap(autoMapColumns(data.data.preview[hRow] ?? [], importType));

      setStep("map");
    } finally { setLoading(false); }
  }

  // Cambiar hoja activa — re-detectar
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
    } finally { setLoading(false); }
  }

  // Aplicar plantilla guardada
  function applyTemplate(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    setSelectedTemplate(templateId);
    setImportType(t.type);
    setHeaderRow(t.headerRow);
    try {
      setColumnMap(JSON.parse(t.columnMap));
    } catch { /* ignorar */ }
  }

  // PASO 2: Preview — enviar el mapeo y obtener datos procesados
  async function handlePreview() {
    const requiredFields = importType === "goleadores" ? GOLEADORES_FIELDS : STANDINGS_FIELDS;
    const missing = requiredFields.filter(f => f.required && !columnMap[f.key]);
    if (missing.length > 0) {
      setError(`Faltan columnas requeridas: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    if (!leagueId.trim()) { setError("Falta el ID de liga."); return; }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("league_id", leagueId.trim());
      fd.append("action", "preview");
      fd.append("mapping", JSON.stringify({
        type: importType,
        sheetName: activeSheet,
        headerRow,
        columnMap,
        jornada: jornada ? parseInt(jornada) : undefined,
      }));

      const res = await fetch("/api/import/bulk", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }

      setPreview(data.data);
      setExcludedRows(new Set());

      if (data.data.type === "goleadores" && data.data.playerResolutions) {
        const auto: Record<string, string> = {};
        for (const pm of data.data.playerResolutions as PlayerResolution[]) {
          auto[pm.rawName] = pm.found && pm.playerId ? pm.playerId : "NEW";
        }
        setResolutions(auto);
      }

      setStep("preview");
    } finally { setLoading(false); }
  }

  // Guardar plantilla
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
        await loadTemplates();
      }
    } finally { setSavingTemplate(false); }
  }

  // PASO 3: Confirmar
  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("league_id", leagueId.trim());
      fd.append("action", "confirm");
      fd.append("mapping", JSON.stringify({
        type: importType,
        sheetName: activeSheet,
        headerRow,
        columnMap,
        jornada: jornada ? parseInt(jornada) : undefined,
      }));
      if (preview?.type === "goleadores") {
        fd.append("resolutions", JSON.stringify(resolutions));
      }
      if (excludedRows.size > 0) {
        fd.append("exclude_rows", JSON.stringify([...excludedRows]));
      }

      const res = await fetch("/api/import/bulk", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setResult(data.data);
      setStep("done");
    } finally { setLoading(false); }
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
  }

  const headerCols = excelPreview[headerRow] ?? [];
  const fields = importType === "goleadores" ? GOLEADORES_FIELDS : STANDINGS_FIELDS;

  return (
    <div className="max-w-4xl">
      {/* Barra de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {(["upload", "map", "preview", "done"] as Step[]).map((s, i) => {
          const labels = ["1. Archivo", "2. Mapear columnas", "3. Vista previa", "4. Listo"];
          const active = step === s;
          const done = ["upload", "map", "preview", "done"].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition
                ${active ? "bg-green-600 text-white" : done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                {done && !active ? "✓" : i + 1} {labels[i]}
              </div>
              {i < 3 && <div className={`h-px w-6 ${done ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>

      {/* ── PASO 1: Subir archivo ── */}
      {step === "upload" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-5">
          <h2 className="font-semibold text-gray-700 text-lg">Seleccionar archivo y liga</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liga <span className="text-red-500">*</span>
            </label>
            {leagues.length === 0 ? (
              <p className="text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                No hay ligas creadas.{" "}
                <a href="/admin/leagues/new" className="underline font-medium">Crear una liga</a>
              </p>
            ) : (
              <select value={leagueId} onChange={e => setLeagueId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— Seleccionar liga —</option>
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {l.season}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de datos</label>
            <div className="flex gap-3">
              {(["goleadores", "standings"] as const).map((t) => (
                <button key={t} onClick={() => setImportType(t)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition
                    ${importType === t ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {t === "goleadores" ? "⚽ Goleadores" : "📊 Tabla de posiciones"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jornada <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input value={jornada} onChange={e => setJornada(e.target.value)}
              type="number" min="1" placeholder="13"
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo Excel</label>
            <input type="file" accept=".xlsx,.xls"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setSelectedTemplate(""); }}
              className="text-sm" />
            {file && <p className="text-xs text-gray-400 mt-1">{file.name}</p>}
          </div>

          {/* Plantillas guardadas */}
          {templates.filter(t => t.type === importType).length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-600 mb-2">Usar plantilla guardada</p>
              <div className="flex gap-2 flex-wrap">
                {templates.filter(t => t.type === importType).map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition
                      ${selectedTemplate === t.id ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300 text-gray-700 hover:border-green-400"}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button onClick={handleDetect} disabled={loading || !file}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            {loading ? "Leyendo archivo..." : "Continuar →"}
          </button>
        </div>
      )}

      {/* ── PASO 2: Mapear columnas ── */}
      {step === "map" && (
        <div className="space-y-5">
          {/* Selector de hoja */}
          {sheets.length > 1 && (
            <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Hoja del Excel:</label>
              <select value={activeSheet} onChange={e => handleSheetChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1">
                {sheets.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Preview de filas */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-medium text-gray-700 text-sm">Vista previa del archivo</p>
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-500">Fila de encabezados:</label>
                <select value={headerRow} onChange={e => setHeaderRow(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm">
                  {excelPreview.map((_, i) => (
                    <option key={i} value={i}>Fila {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <tbody>
                  {excelPreview.map((row, ri) => (
                    <tr key={ri} className={ri === headerRow ? "bg-yellow-50 font-semibold" : ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-2 py-1.5 text-gray-400 border-r border-gray-100 w-8 text-center">
                        {ri === headerRow ? "★" : ri + 1}
                      </td>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 border-r border-gray-100 max-w-[140px] truncate">
                          <span className="text-gray-400 text-xs mr-1">{ci}</span>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 px-4 py-2">
              Los números pequeños (0, 1, 2...) son los índices de columna que usarás en el mapeo.
            </p>
          </div>

          {/* Mapeo de columnas */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Mapear columnas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key} className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 w-48 shrink-0">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <select value={columnMap[f.key] ?? ""}
                    onChange={e => setColumnMap({ ...columnMap, [f.key]: e.target.value })}
                    className={`flex-1 border rounded-lg px-2 py-1.5 text-sm
                      ${f.required && !columnMap[f.key] ? "border-red-300 bg-red-50" : "border-gray-300"}`}>
                    <option value="">— no usar —</option>
                    {headerCols.map((col, i) => (
                      <option key={i} value={String(i)}>
                        {i}: {col || "(vacío)"}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Guardar como plantilla */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Guardar como plantilla para reusar</p>
            <div className="flex gap-2">
              <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
                placeholder={`Ej: Goleadores Liga Lunes`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={handleSaveTemplate} disabled={savingTemplate || !newTemplateName.trim()}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
                {savingTemplate ? "Guardando..." : "Guardar plantilla"}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => { setStep("upload"); setError(""); }}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-200">
              ← Atrás
            </button>
            <button onClick={handlePreview} disabled={loading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? "Procesando..." : "Ver vista previa →"}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Vista previa ── */}
      {step === "preview" && preview && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${preview.type === "goleadores" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {preview.type === "goleadores" ? "⚽ Goleadores" : "📊 Posiciones"}
            </span>
            {preview.jornada && <span className="text-sm text-gray-500">Jornada {preview.jornada}</span>}
            <span className="text-sm text-gray-400 ml-auto">
              {preview.type === "goleadores"
                ? `${preview.summary.players} jugadores · ${preview.summary.totalGoals} goles`
                : `${preview.summary.teams} equipos`}
            </span>
          </div>

          {preview.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="font-medium text-yellow-800 text-sm mb-2">Avisos</p>
              <ul className="space-y-1">
                {preview.warnings.map((w, i) => <li key={i} className="text-xs text-yellow-700">⚠ {w}</li>)}
              </ul>
            </div>
          )}

          {/* Resolución de jugadores */}
          {preview.type === "goleadores" && preview.playerResolutions && (
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold text-gray-700 mb-4">
                Jugadores
                <span className="text-xs font-normal text-gray-400 ml-2">
                  {preview.playerResolutions.filter(p => p.found).length} encontrados · {preview.playerResolutions.filter(p => !p.found).length} nuevos
                </span>
              </h2>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {preview.playerResolutions.map(pm => (
                  <div key={pm.rawName} className="flex items-center gap-3">
                    <div className="w-44 shrink-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{pm.rawName}</p>
                      <p className="text-xs text-gray-400 truncate">{pm.teamName}</p>
                    </div>
                    <select value={resolutions[pm.rawName] ?? "NEW"}
                      onChange={e => setResolutions({ ...resolutions, [pm.rawName]: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                      <option value="NEW">+ Crear jugador nuevo</option>
                      {pm.candidates.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName}{c.alias ? ` (${c.alias})` : ""}</option>
                      ))}
                    </select>
                    <span className={`text-xs font-medium w-16 text-right ${pm.found ? "text-green-600" : "text-yellow-600"}`}>
                      {pm.found ? "✓ Match" : "Nuevo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de datos */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {excludedRows.size > 0 && (
              <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 text-xs text-yellow-700">
                {excludedRows.size} fila{excludedRows.size !== 1 ? "s" : ""} excluida{excludedRows.size !== 1 ? "s" : ""} — no se importará{excludedRows.size !== 1 ? "n" : ""}.
              </div>
            )}
            {preview.type === "goleadores" ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Jugador</th>
                    <th className="px-3 py-2 text-left">Equipo</th>
                    <th className="px-3 py-2 text-center">Goles</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(preview.rows as GoleadoresRow[]).map((r, i) => {
                    const key = `g:${i}:${r.rawName}`;
                    const excluded = excludedRows.has(key);
                    return (
                      <tr key={i} className={excluded ? "opacity-40 line-through bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-3 py-2 font-medium text-gray-800">{r.rawName}</td>
                        <td className="px-3 py-2 text-gray-500">{r.teamName || "—"}</td>
                        <td className="px-3 py-2 text-center font-bold text-green-600">{r.goals}</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => setExcludedRows(prev => {
                            const next = new Set(prev);
                            excluded ? next.delete(key) : next.add(key);
                            return next;
                          })} title={excluded ? "Restaurar" : "Excluir fila"}
                            className="text-gray-300 hover:text-red-500 transition text-base leading-none">
                            {excluded ? "↩" : "✕"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Equipo</th>
                    <th className="px-3 py-2 text-center">JJ</th>
                    <th className="px-3 py-2 text-center">G</th>
                    <th className="px-3 py-2 text-center">E</th>
                    <th className="px-3 py-2 text-center">P</th>
                    <th className="px-3 py-2 text-center">GF</th>
                    <th className="px-3 py-2 text-center">GC</th>
                    <th className="px-3 py-2 text-center font-bold">Pts</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(preview.rows as StandingsRow[]).map((r, i) => {
                    const key = `s:${i}:${r.teamName}`;
                    const excluded = excludedRows.has(key);
                    return (
                      <tr key={r.teamName} className={excluded ? "opacity-40 line-through bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-3 py-2 text-gray-400">{r.position}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{r.teamName}</td>
                        <td className="px-3 py-2 text-center">{r.played}</td>
                        <td className="px-3 py-2 text-center text-green-600">{r.wins}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{r.draws}</td>
                        <td className="px-3 py-2 text-center text-red-500">{r.losses}</td>
                        <td className="px-3 py-2 text-center">{r.goalsFor}</td>
                        <td className="px-3 py-2 text-center">{r.goalsAgainst}</td>
                        <td className="px-3 py-2 text-center font-bold">{r.points}</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => setExcludedRows(prev => {
                            const next = new Set(prev);
                            excluded ? next.delete(key) : next.add(key);
                            return next;
                          })} title={excluded ? "Restaurar" : "Excluir fila"}
                            className="text-gray-300 hover:text-red-500 transition text-base leading-none">
                            {excluded ? "↩" : "✕"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => { setStep("map"); setError(""); }}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-200">
              ← Atrás
            </button>
            <button onClick={handleConfirm} disabled={loading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? "Importando..." : "Confirmar e importar ✓"}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 4: Listo ── */}
      {step === "done" && result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="font-bold text-green-800 text-xl mb-4">Importación completada</h2>
          <div className="flex justify-center gap-8 mb-6">
            <div>
              <p className="text-3xl font-black text-green-700">{result.upserted}</p>
              <p className="text-sm text-gray-500">registros actualizados</p>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-600">{result.created}</p>
              <p className="text-sm text-gray-500">creados nuevos</p>
            </div>
          </div>
          <button onClick={reset} className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700">
            Nueva importación
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function guessHeaderRow(preview: string[][]): number {
  let bestRow = 0;
  let bestScore = 0;
  for (let i = 0; i < Math.min(preview.length, 8); i++) {
    const nonEmpty = preview[i].filter(c => c !== "").length;
    if (nonEmpty > bestScore) { bestScore = nonEmpty; bestRow = i; }
  }
  return bestRow;
}

// Normaliza un texto para comparación: mayúsculas, sin acentos, sin espacios extra
function norm(s: string): string {
  return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Dado el contenido de la fila de encabezado, devuelve un columnMap inicial
function autoMapColumns(
  headerCols: string[],
  type: "goleadores" | "standings"
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
      // Exact match first, then partial match
      const exactMatch = keywords.some(k => norm(k) === cell);
      const partialMatch = !exactMatch && keywords.some(k => cell.includes(norm(k)) || norm(k).includes(cell));
      if (exactMatch || partialMatch) {
        map[field] = String(ci);
        usedCols.add(ci);
        break;
      }
    }
  }

  return map;
}
