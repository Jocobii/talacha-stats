"use client";

/**
 * features/league-onboarding/ui/WizardShared.tsx
 * Primitivos compartidos entre pasos del wizard.
 */

// ── WizardFooter ──────────────────────────────────────────────────────────────

type WizardFooterProps = {
	leftHint: string;
	secondary?: React.ReactNode;
	primary: React.ReactNode;
};

export function WizardFooter({ leftHint, secondary, primary }: WizardFooterProps) {
	return (
		<div className="flex items-center justify-between gap-3 pt-2">
			<span className="text-[12px] text-ink-3">{leftHint}</span>
			<div className="flex items-center gap-2">
				{secondary}
				{primary}
			</div>
		</div>
	);
}

// ── MiniStat ──────────────────────────────────────────────────────────────────

type MiniStatProps = { label: string; value: number; brand?: boolean };

export function MiniStat({ label, value, brand }: MiniStatProps) {
	return (
		<div className="bg-surface-2/60 border border-line rounded-md px-3 py-2.5">
			<div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">
				{label}
			</div>
			<div
				className={`font-display text-2xl font-black leading-none mt-1 ${brand ? "text-brand" : "text-ink"}`}
			>
				{value}
			</div>
		</div>
	);
}
