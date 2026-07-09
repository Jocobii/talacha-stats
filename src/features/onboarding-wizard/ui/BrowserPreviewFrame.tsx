"use client";

/**
 * features/onboarding-wizard/ui/BrowserPreviewFrame.tsx
 * Marco de "navegador" (dots + barra de dirección) alrededor de
 * ThemePreviewCard. Extraído para que el aside persistente (paso 1-3) y la
 * pantalla final (StepFinale) pinten exactamente el mismo preview sin
 * duplicar el markup (§3.5).
 */

import { ThemePreviewCard } from "@/features/org-theming/ui/ThemePreviewCard";
import type { OrgThemeTokens } from "@/shared/org-theme";
import { cn } from "@/shared/lib/cn";

type Props = {
	slug: string;
	orgName?: string;
	logoUrl?: string;
	tokens: OrgThemeTokens;
	fontFamily?: string;
	className?: string;
};

export function BrowserPreviewFrame({
	slug,
	orgName,
	logoUrl,
	tokens,
	fontFamily,
	className,
}: Props) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border border-line-2 bg-[#0d0d0d] shadow-2xl",
				className,
			)}
		>
			<div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2.5">
				<span className="flex gap-1.5">
					<i className="h-2.5 w-2.5 rounded-full bg-line-2" />
					<i className="h-2.5 w-2.5 rounded-full bg-line-2" />
					<i className="h-2.5 w-2.5 rounded-full bg-line-2" />
				</span>
				<span className="flex-1 truncate rounded border border-line bg-pitch px-2.5 py-1 font-mono text-[10.5px] text-ink-3">
					talachastats.com/<span className="text-ink-2">{slug || "tu-liga"}</span>
				</span>
			</div>

			<ThemePreviewCard
				tokens={tokens}
				orgName={orgName}
				fontFamily={fontFamily}
				logoUrl={logoUrl}
			/>
		</div>
	);
}
