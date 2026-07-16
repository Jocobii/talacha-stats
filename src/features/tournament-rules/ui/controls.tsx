"use client";

/**
 * features/tournament-rules/ui/controls.tsx
 * Inputs tontos del reglamento — sin fetch, sin reglas de negocio (§7.3).
 */
import { cn } from "@/shared/lib/cn";

export function NumInput({
	value,
	onChange,
	suffix,
	disabled,
	width = 88,
}: {
	value: number;
	onChange: (v: number) => void;
	suffix?: string;
	disabled?: boolean;
	width?: number;
}) {
	return (
		<div className="flex items-center gap-2">
			<input
				type="number"
				min={0}
				value={value}
				disabled={disabled}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ width }}
				className="h-[38px] rounded-lg border border-line bg-pitch px-3 text-sm font-semibold text-ink outline-none focus:border-brand-ink disabled:opacity-50"
			/>
			{suffix && <span className="text-[13px] text-ink-2">{suffix}</span>}
		</div>
	);
}

export function ToggleSwitch({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			aria-pressed={checked}
			className={cn(
				"w-[42px] h-6 rounded-full relative shrink-0 transition-colors",
				checked ? "bg-brand" : "bg-line-2",
			)}
		>
			<span
				className={cn(
					"absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-[left]",
					checked ? "left-5" : "left-0.5",
				)}
			/>
		</button>
	);
}

export function Segmented<T extends string | number>({
	options,
	value,
	onChange,
}: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
}) {
	return (
		<div className="inline-flex bg-surface-2 border border-line rounded-[10px] p-[3px] gap-0.5">
			{options.map((o) => (
				<button
					key={o.value}
					type="button"
					onClick={() => onChange(o.value)}
					className={cn(
						"border-none px-3.5 py-1.5 rounded-[7px] text-[13px] font-semibold transition-all",
						value === o.value
							? "bg-surface text-brand-ink shadow-[0_0_0_1px_var(--color-line-2)]"
							: "bg-transparent text-ink-2",
					)}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}

export function SelectField<T extends string>({
	value,
	onChange,
	options,
}: {
	value: T;
	onChange: (v: T) => void;
	options: { value: T; label: string }[];
}) {
	return (
		<div className="relative">
			<select
				value={value}
				onChange={(e) => onChange(e.target.value as T)}
				className="appearance-none h-[38px] min-w-[240px] rounded-lg border border-line bg-pitch pl-3 pr-8 text-[13.5px] font-semibold text-ink outline-none cursor-pointer"
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
			<span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3 text-[10px]">
				▾
			</span>
		</div>
	);
}
