"use client";

/**
 * features/league-onboarding/ui/TeamChipsInput.tsx
 *
 * Campo de "fichas" para capturar equipos sin depender de que el usuario lea
 * instrucciones. La interacción se enseña sola:
 *   - escribe un nombre y presiona Enter (o coma) → aparece una ficha
 *   - pega una lista en cualquier formato → la separamos en fichas
 *   - Backspace con el campo vacío borra la última ficha
 *
 * El dedup se hace por forma canónica (igual que la DB) — nada repetido entra,
 * y el usuario lo ve antes de guardar.
 */

import { useState } from "react";
import { X } from "lucide-react";
import { splitTeamInput, mergeTeamNames, MAX_TEAMS } from "../lib/parse-team-names";

type Props = {
	value: string[];
	onChange: (names: string[]) => void;
};

export function TeamChipsInput({ value, onChange }: Props) {
	const [draft, setDraft] = useState("");
	const [notice, setNotice] = useState<string | null>(null);

	function commit(raw: string) {
		const parts = splitTeamInput(raw);
		if (parts.length === 0) {
			setDraft("");
			return;
		}
		const result = mergeTeamNames(value, parts);
		if (result.addedCount > 0) onChange(result.names);

		const problems: string[] = [];
		if (result.duplicates.length > 0) {
			problems.push(`ya estaba: ${[...new Set(result.duplicates)].join(", ")}`);
		}
		if (result.tooLong.length > 0) problems.push("hay un nombre demasiado largo");
		if (result.overflow > 0) problems.push(`máximo ${MAX_TEAMS} equipos`);
		setNotice(problems.length > 0 ? problems.join(" · ") : null);
		setDraft("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			commit(draft);
		} else if (e.key === "Backspace" && draft === "" && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	}

	function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
		const text = e.clipboardData.getData("text");
		// Solo interceptamos si parece una lista (tiene separadores).
		if (/[\n\r,;\t]/.test(text)) {
			e.preventDefault();
			commit(draft ? `${draft},${text}` : text);
		}
	}

	function removeAt(i: number) {
		setNotice(null);
		onChange(value.filter((_, idx) => idx !== i));
	}

	return (
		<div>
			<div className="flex flex-wrap gap-2 p-2.5 rounded-lg border border-line bg-surface-2 min-h-[92px] content-start focus-within:ring-2 focus-within:ring-brand">
				{value.map((name, i) => (
					<span
						key={`${name}-${i}`}
						className="inline-flex items-center gap-1.5 bg-surface border border-line rounded-full pl-3 pr-1.5 py-1 text-sm text-ink"
					>
						{name}
						<button
							type="button"
							onClick={() => removeAt(i)}
							className="text-ink-3 hover:text-ink"
							aria-label={`Quitar ${name}`}
						>
							<X size={14} strokeWidth={2} />
						</button>
					</span>
				))}
				<input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					onBlur={() => draft.trim() && commit(draft)}
					placeholder={value.length === 0 ? "Escribe un equipo y Enter" : "Agregar otro…"}
					className="flex-1 min-w-[140px] bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none py-1"
				/>
			</div>
			<div className="flex items-center justify-between gap-3 mt-2">
				<span className="text-xs text-ink-3">
					{value.length === 0
						? "¿Tienes la lista? Pégala y la separamos por ti."
						: `${value.length} equipo${value.length === 1 ? "" : "s"}`}
				</span>
				{notice && <span className="text-xs text-amber-400 text-right">{notice}</span>}
			</div>
		</div>
	);
}
