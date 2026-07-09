"use client";

/**
 * features/arranque-onboarding/ui/WizardShared.tsx
 * Primitivo compartido entre pasos del wizard. Espeja WizardFooter de
 * features/league-onboarding/ui/WizardShared.tsx (no se importa: §3.1
 * prohíbe features → features).
 */

import type { ReactNode } from "react";

type WizardFooterProps = {
	leftHint: string;
	secondary?: ReactNode;
	primary: ReactNode;
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
