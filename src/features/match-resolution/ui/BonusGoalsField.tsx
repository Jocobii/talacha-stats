"use client";
/**
 * features/match-resolution/ui/BonusGoalsField.tsx
 * Campo de goles de equipo no atribuibles a jugador.
 */
type Props = {
	value: number;
	onChange: (v: number) => void;
	disabled?: boolean;
	title?: string;
};

const DEFAULT_TITLE = "Goles no atribuibles a jugador. Ej: gol por llegada tardía del rival";

export function BonusGoalsField({ value, onChange, disabled, title }: Props) {
	return (
		<div className="flex items-center gap-2 px-3 py-2 border-t border-line">
			<label className="text-xs text-ink-3 flex-1" title={title ?? DEFAULT_TITLE}>
				Goles de equipo
			</label>
			<input
				type="number"
				min={0}
				max={99}
				value={value}
				onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
				disabled={disabled}
				inputMode="numeric"
				className="w-12 text-center text-sm bg-surface-2 border border-line text-ink rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-40"
			/>
		</div>
	);
}
