/**
 * OrgWallOfFame.tsx — Zona 2 (Valor y Ego) del home del subdominio: carrusel
 * horizontal de los goleadores de TODA la organización (todas las ligas
 * activas). Presentacional/server-safe — datos ya resueltos por
 * `getOrgTopScorers` (entities/organization).
 */

import { Inline, Stack } from "@/shared/ui/layout";
import { Typography } from "@/shared/ui";
import { Link } from "@/shared/i18n/navigation";
import type { OrgTopScorer } from "@/entities/organization";
import { OrgWallOfFameCard } from "./OrgWallOfFameCard";

export type OrgWallOfFameLabels = {
	title: string;
	topScorersLink: string;
	cta: string;
	ctaLink: string;
	empty: string;
};

export function OrgWallOfFame({
	scorers,
	rankingHref,
	labels,
}: {
	scorers: OrgTopScorer[];
	rankingHref: string;
	labels: OrgWallOfFameLabels;
}) {
	return (
		// min-w-0: esta columna vive dentro de un CSS grid (page.tsx) — sin esto,
		// un hijo con overflow-x-auto se estira al ancho de TODO su contenido en
		// vez de recortarlo (el grid track crece con él y el scroll nunca se
		// activa; el corte visual que se ve viene de `overflow-x-hidden` en
		// <main>, no de un scroll real). Bug clásico de flex/grid: los items
		// tienen `min-width:auto` por default.
		<Stack gap="sm" className="min-w-0">
			<Inline justify="between" align="center">
				<Typography
					variant="caption"
					weight="bold"
					tone="ink-3"
					className="uppercase tracking-wide"
				>
					{labels.title}
				</Typography>
				<Link href={rankingHref} className="text-xs font-semibold text-brand-ink">
					{labels.topScorersLink}
				</Link>
			</Inline>

			{scorers.length === 0 ? (
				<div className="bg-surface border border-line rounded-xl px-4 py-8 text-center text-[13px] text-ink-3">
					{labels.empty}
				</div>
			) : (
				<div className="relative min-w-0">
					<Inline
						gap="sm"
						className="min-w-0 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory"
					>
						{scorers.map((scorer, i) => (
							<div key={`${scorer.playerId ?? scorer.fullName}-${i}`} className="snap-start">
								<OrgWallOfFameCard scorer={scorer} rank={i + 1} />
							</div>
						))}
					</Inline>
					{/* Fade a la derecha — señala que hay más contenido para hacer scroll */}
					<div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-pitch to-transparent" />
				</div>
			)}

			<Typography variant="caption" tone="ink-3" className="text-center leading-relaxed">
				{labels.cta}{" "}
				<Link href={rankingHref} className="font-semibold text-amber-400">
					{labels.ctaLink}
				</Link>
			</Typography>
		</Stack>
	);
}
