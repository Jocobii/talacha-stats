/**
 * UploadStep — paso 1. Subir el Excel de la tabla de posiciones.
 * Mobile-first: zona de toque grande, una sola columna, instrucciones breves
 * (<100 palabras), liga opcional claramente marcada. Al elegir archivo se
 * parsea y avanza solo (menos toques).
 */

import { useRef } from "react";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";

export function UploadStep({
	leagueName,
	onLeagueName,
	onFile,
	parsing,
	error,
}: {
	leagueName: string;
	onLeagueName: (value: string) => void;
	onFile: (file: File) => void;
	parsing: boolean;
	error: string | null;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	const hasLeague = leagueName.trim().length >= 2;

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) onFile(file);
		e.target.value = ""; // permitir re-subir el mismo archivo
	}

	return (
		<div className="space-y-5">
			<p className="text-sm text-ink-2">
				Sube el Excel con la <strong className="text-ink">tabla de posiciones</strong> de cualquier
				liga. Detectamos las columnas solas; tú solo eliges los dos equipos.
			</p>

			{/* Paso 1: nombre de liga (obligatorio — primero, lo fácil va antes). */}
			<div>
				<label
					htmlFor="excel-league-name"
					className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2"
				>
					Nombre de la liga <span className="text-red-400">*</span>
				</label>
				<input
					id="excel-league-name"
					type="text"
					value={leagueName}
					onChange={(e) => onLeagueName(e.target.value)}
					placeholder="Ej. Mi Liga, Novofut etc."
					className="w-full min-h-[48px] bg-pitch border border-line text-ink rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
				/>
				<p className="text-xs text-ink-3 mt-1.5">Aparece como título del reporte.</p>
			</div>

			{/* Paso 2: subir (bloqueado hasta tener el nombre de la liga). */}
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				disabled={parsing || !hasLeague}
				className="w-full min-h-[160px] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-2 px-6 text-center transition active:scale-[0.99] disabled:opacity-50"
			>
				{parsing ? (
					<>
						<Loader2 size={40} className="text-brand-ink animate-spin" />
						<span className="text-sm text-ink-2">Leyendo tu archivo…</span>
					</>
				) : (
					<>
						<UploadCloud size={40} className={hasLeague ? "text-brand-ink" : "text-ink-3"} />
						<span className="font-display font-black text-lg uppercase tracking-wide text-ink">
							Tocar para subir
						</span>
						<span className="text-xs text-ink-3 flex items-center gap-1.5">
							<FileSpreadsheet size={14} /> Excel .xlsx o .xls
						</span>
					</>
				)}
			</button>
			{!hasLeague && (
				<p className="text-xs text-ink-3 -mt-3 text-center">
					Escribe el nombre de la liga para habilitar la subida.
				</p>
			)}

			<input
				ref={inputRef}
				type="file"
				accept=".xlsx,.xls"
				onChange={handleChange}
				className="hidden"
			/>

			{error && (
				<p className="text-red-400 text-sm bg-red-950 border border-red-900 px-3 py-2.5 rounded-xl">
					{error}
				</p>
			)}
		</div>
	);
}
