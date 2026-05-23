"use client";

import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";

type Props = {
	onClick: () => void;
	selected?: boolean;
	variant?: Variant;
	disabled?: boolean;
	"aria-label": string;
	children: ReactNode;
};

const BASE =
	"w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1";

const VARIANTS: Record<Variant, { idle: string; selected: string }> = {
	primary: {
		idle: "border-line bg-surface text-ink hover:border-brand/40 hover:bg-brand/5",
		selected: "border-brand bg-brand/10 text-brand-ink",
	},
	secondary: {
		idle: "border-line bg-surface text-ink-2 hover:border-blue/40 hover:bg-blue/5",
		selected: "border-blue/60 bg-blue/10 text-blue",
	},
	danger: {
		idle: "border-line bg-surface text-ink-3 hover:border-rose/30 hover:bg-rose/5",
		selected: "border-rose/40 bg-rose/10 text-rose",
	},
};

export function CandidateButton({
	onClick,
	selected = false,
	variant = "primary",
	disabled = false,
	"aria-label": ariaLabel,
	children,
}: Props) {
	const { idle, selected: sel } = VARIANTS[variant];
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			aria-pressed={selected}
			className={[
				BASE,
				selected ? sel : idle,
				disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
			].join(" ")}
		>
			<span className="flex items-start gap-2.5">
				<span
					className={[
						"mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
						selected ? "border-current bg-current" : "border-ink-3",
					].join(" ")}
				>
					{selected && <span className="w-1.5 h-1.5 rounded-full bg-pitch block" />}
				</span>
				<span className="flex-1">{children}</span>
			</span>
		</button>
	);
}
