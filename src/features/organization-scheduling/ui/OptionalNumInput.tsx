"use client";

/**
 * features/organization-scheduling/ui/OptionalNumInput.tsx
 * Input numérico donde vacío = null ("automático"). Usado solo por
 * "Jornadas regulares" (decisión D-2, docs/ORG-PROFILE-HUB.md §6).
 */

type Props = {
	value: number | null;
	onChange: (v: number | null) => void;
	placeholder?: string;
	suffix?: string;
	width?: number;
};

export function OptionalNumInput({ value, onChange, placeholder, suffix, width = 110 }: Props) {
	return (
		<div className="flex items-center gap-2">
			<input
				type="number"
				min={1}
				value={value ?? ""}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
				style={{ width }}
				className="h-[38px] rounded-lg border border-line bg-pitch px-3 text-sm font-semibold text-ink outline-none focus:border-brand-ink placeholder:text-ink-3 placeholder:text-[11px] placeholder:font-normal"
			/>
			{suffix && <span className="text-[13px] text-ink-2">{suffix}</span>}
		</div>
	);
}
