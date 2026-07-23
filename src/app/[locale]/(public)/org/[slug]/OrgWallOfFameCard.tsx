/**
 * OrgWallOfFameCard.tsx — tarjeta individual del carrusel del Muro de la Fama.
 * Extraída de OrgWallOfFame para mantener ambos archivos bajo 150 líneas
 * (§3.5 AGENTS.md). Puramente presentacional.
 */

import { Stack } from "@/shared/ui/layout";
import { Typography } from "@/shared/ui";
import type { OrgTopScorer } from "@/entities/organization";

export function OrgWallOfFameCard({ scorer, rank }: { scorer: OrgTopScorer; rank: number }) {
	return (
		<Stack
			gap="xs"
			align="center"
			className="relative shrink-0 w-[108px] bg-surface border border-line rounded-2xl px-2.5 py-3"
		>
			<span className="absolute top-2 left-2 font-display font-black text-xs text-amber-400">
				#{rank}
			</span>
			<span className="w-11 h-11 rounded-full bg-white/[0.08] border border-line" aria-hidden />
			<Typography
				variant="caption"
				weight="semibold"
				className="text-center leading-tight truncate w-full"
			>
				{scorer.fullName}
			</Typography>
			<Typography variant="h3" as="span" className="text-brand-ink">
				{scorer.goals}
			</Typography>
			<Typography variant="caption" tone="ink-3" truncate className="w-full text-center">
				{scorer.teamName ?? "—"}
			</Typography>
		</Stack>
	);
}
