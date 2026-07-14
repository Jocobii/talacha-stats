"use client";

/**
 * features/tournament-rules/ui/primitives.tsx
 * Piezas de layout reutilizadas por las secciones del reglamento. Tontas —
 * sin fetch, sin reglas de negocio (§7.3). `.chip` sale de globals.css.
 */
import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function SectionCard({
	title,
	subtitle,
	locked,
	children,
}: {
	title: string;
	subtitle?: string;
	locked?: boolean;
	children: ReactNode;
}) {
	return (
		<section
			className={cn(
				"bg-surface border border-line rounded-[14px] px-6 py-6",
				locked && "opacity-70 pointer-events-none",
			)}
		>
			<div className="mb-4">
				<h2 className="font-display text-[22px] font-extrabold tracking-tight text-ink">{title}</h2>
				{subtitle && <p className="text-[13.5px] text-ink-2 mt-1 leading-relaxed">{subtitle}</p>}
			</div>
			{children}
		</section>
	);
}

export function Accordion({
	title,
	subtitle,
	defaultOpen = false,
	children,
}: {
	title: string;
	subtitle?: string;
	defaultOpen?: boolean;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<section className="bg-surface border border-line rounded-[14px] overflow-hidden">
			<button
				onClick={() => setOpen((o) => !o)}
				className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
			>
				<div>
					<h2 className="font-display text-[22px] font-extrabold tracking-tight text-ink">
						{title}
					</h2>
					{subtitle && <p className="text-[13.5px] text-ink-2 mt-1">{subtitle}</p>}
				</div>
				<span
					className={cn(
						"shrink-0 w-7 h-7 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-ink-2 transition-transform",
						open && "rotate-180",
					)}
				>
					<ChevronDown size={14} />
				</span>
			</button>
			{open && <div className="px-6 pb-5">{children}</div>}
		</section>
	);
}

export function FieldRow({
	label,
	hint,
	isDefault,
	children,
}: {
	label: string;
	hint?: string;
	isDefault?: boolean;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4 py-3.5 border-t border-line first:border-t-0">
			<div className="min-w-[240px] flex-1 basis-[260px]">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-[14.5px] font-semibold text-ink">{label}</span>
					{isDefault && <span className="chip brand">Por defecto</span>}
				</div>
				{hint && <p className="text-xs text-ink-3 mt-1 leading-relaxed max-w-[420px]">{hint}</p>}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}
