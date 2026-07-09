"use client";

/**
 * features/onboarding-wizard/ui/OnboardingPreviewAside.tsx
 *
 * Preview persistente del sitio público, a un lado del wizard (no dentro de
 * un paso): refleja en vivo nombre/logo/estilo (paso Identidad, vía
 * draftIdentity) y cancha/liga en cuanto existen (paso Operación en
 * adelante). El marco de navegador + mini-sitio vive en BrowserPreviewFrame
 * (compartido con StepFinale, §3.5).
 *
 * El tratamiento visual (glow + grid) reusa las utilidades ya existentes en
 * globals.css (`auth-brand-glow` / `auth-brand-grid`, usadas hoy en
 * /register) en vez de inventar CSS custom nuevo (§11).
 */

import { resolveOrgStyleTokens } from "@/features/org-theming/ui/OrgStyleStep";
import { DAYS } from "../model/onboarding-league-schema";
import { toOrgStyleValue } from "../lib/to-org-style-value";
import { BrowserPreviewFrame } from "./BrowserPreviewFrame";
import type { CreatedLeagueView, CreatedVenueView, StyleDraft } from "../types";

type Props = {
	name: string;
	slug: string;
	logoUrl: string;
	style: StyleDraft;
	league: CreatedLeagueView | null;
	venue: CreatedVenueView | null;
};

export function OnboardingPreviewAside({ name, slug, logoUrl, style, league, venue }: Props) {
	const { tokens, fontFamily } = resolveOrgStyleTokens(toOrgStyleValue(style));
	const dayLabel = league
		? (DAYS.find((d) => d.value === league.dayOfWeek)?.label ?? league.dayOfWeek)
		: null;

	return (
		<aside className="auth-brand-glow relative hidden flex-col overflow-hidden rounded-xl border border-line p-6 lg:sticky lg:top-6 lg:flex">
			<div className="auth-brand-grid pointer-events-none absolute inset-0 opacity-40" />

			<div className="relative z-10 mb-5 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">
				<span className="flex items-center gap-2">
					<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
					Así se verá tu sitio
				</span>
				<span>En vivo</span>
			</div>

			<BrowserPreviewFrame
				className="relative z-10"
				slug={slug}
				orgName={name || undefined}
				logoUrl={logoUrl || undefined}
				tokens={tokens}
				fontFamily={fontFamily}
			/>

			{venue && league && (
				<div className="relative z-10 mt-4 rounded-lg border border-dashed border-line-2 bg-pitch p-3.5">
					<p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-ink">
						Próxima jornada
					</p>
					<p className="text-xs text-ink-2">
						<span className="font-medium text-ink">{venue.name}</span> · {dayLabel}
					</p>
				</div>
			)}

			<p className="relative z-10 mt-5 text-center text-xs leading-relaxed text-ink-3">
				Tu página pública se actualiza sola con cada partido.
				<br />
				<b className="text-ink-2">
					{name ? `Estilo listo para ${name}.` : "Elige un estilo para verlo cambiar."}
				</b>
			</p>
		</aside>
	);
}
