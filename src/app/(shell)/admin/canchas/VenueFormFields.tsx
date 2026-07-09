"use client";

import { VENUE_COLORS } from "@/types";
import type { VenueWithStats } from "@/entities/venue";

export type FormState = {
	name: string;
	address: string;
	city: string;
	capacity: number;
	color: string;
	notes: string;
};

export const DEFAULT_FORM: FormState = {
	name: "",
	address: "",
	city: "",
	capacity: 1,
	color: VENUE_COLORS[5]!, // #60A5FA
	notes: "",
};

export function formFromVenue(v: VenueWithStats): FormState {
	return {
		name: v.name,
		address: v.address ?? "",
		city: v.city ?? "",
		capacity: v.capacity,
		color: v.color,
		notes: v.notes ?? "",
	};
}

export const inputCls =
	"w-full bg-surface-2 border border-line rounded-md px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30";

const stepBtn =
	"w-8 h-8 rounded-md bg-surface-2 border border-line text-ink text-sm hover:bg-surface font-bold transition";

export function Field({
	label,
	sub,
	required,
	optional,
	children,
}: {
	label: string;
	sub?: string;
	required?: boolean;
	optional?: boolean;
	children: React.ReactNode;
}) {
	return (
		<label className="block">
			<div className="flex items-baseline gap-1.5 mb-1.5">
				<span className="text-[12px] font-semibold text-ink">{label}</span>
				{required && <span className="text-[10px] text-red-400 font-bold">•</span>}
				{optional && <span className="text-[10px] text-ink-3">(opcional)</span>}
				{sub && <span className="text-[11px] text-ink-3 ml-auto">{sub}</span>}
			</div>
			{children}
		</label>
	);
}

export function CapacityStepper({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<button type="button" onClick={() => onChange(Math.max(1, value - 1))} className={stepBtn}>
				−
			</button>
			<span className="flex-1 text-center text-[13.5px] font-mono font-bold text-ink bg-surface-2 border border-line rounded-md py-2">
				{value}
			</span>
			<button type="button" onClick={() => onChange(Math.min(6, value + 1))} className={stepBtn}>
				+
			</button>
		</div>
	);
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
	return (
		<div className="flex gap-2 flex-wrap">
			{VENUE_COLORS.map((c) => (
				<button
					key={c}
					type="button"
					onClick={() => onChange(c)}
					style={{ background: c }}
					className={`w-7 h-7 rounded-md transition-transform ${value === c ? "ring-2 ring-offset-2 ring-offset-surface ring-brand scale-110" : "opacity-80 hover:opacity-100 hover:scale-105"}`}
					aria-label={`Color ${c}`}
				/>
			))}
		</div>
	);
}
