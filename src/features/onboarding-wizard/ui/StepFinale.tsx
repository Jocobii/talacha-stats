"use client";

/**
 * features/onboarding-wizard/ui/StepFinale.tsx
 * Pantalla final: confeti + resumen (chips) + el mismo preview del sitio
 * público que se fue armando en el aside (BrowserPreviewFrame) + CTAs hacia
 * el wizard de equipos/jugadores o el panel. Full-screen a propósito (mismo
 * tratamiento que el mock de referencia): es el remate del onboarding, no
 * un paso más del wizard de 3 columnas.
 */

import Link from "next/link";
import { Check, MapPin, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { resolveOrgStyleTokens } from "@/features/org-theming/ui/OrgStyleStep";
import { useConfettiPieces } from "../model/useConfettiPieces";
import { DAYS } from "../model/onboarding-league-schema";
import { toOrgStyleValue } from "../lib/to-org-style-value";
import { formatClockLabel } from "../lib/format-clock-label";
import { BrowserPreviewFrame } from "./BrowserPreviewFrame";
import type {
	CreatedLeagueView,
	CreatedVenueView,
	OrgIdentityView,
	ScheduleDraft,
	StyleDraft,
} from "../types";

type Props = {
	org: OrgIdentityView;
	venue: CreatedVenueView;
	league: CreatedLeagueView;
	schedule: ScheduleDraft;
	logoUrl: string;
	style: StyleDraft;
};

export function StepFinale({ org, venue, league, schedule, logoUrl, style }: Props) {
	const confetti = useConfettiPieces();
	const { tokens, fontFamily } = resolveOrgStyleTokens(toOrgStyleValue(style));
	const dayLabel = DAYS.find((d) => d.value === league.dayOfWeek)?.label ?? league.dayOfWeek;
	const hoursLabel = `${formatClockLabel(schedule.startTime)}–${formatClockLabel(schedule.endTime)}`;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-pitch">
			<div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
				{confetti.map((c) => (
					<i
						key={c.id}
						className="animate-confetti-fall absolute -top-4 rounded-sm"
						style={{
							left: `${c.left}%`,
							width: c.size,
							height: c.size * 1.7,
							background: c.color,
							animationDuration: `${c.duration}s`,
							animationDelay: `${c.delay}s`,
							transform: `rotate(${c.rotate}deg)`,
						}}
					/>
				))}
			</div>

			<div className="relative z-10 mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center px-6 py-16 text-center">
				<div className="mb-6 grid h-20 w-20 place-items-center rounded-full border border-brand/35 bg-brand/15">
					<Check size={32} strokeWidth={3} className="text-brand-ink" />
				</div>

				<h2 className="mb-2.5 font-display text-[clamp(28px,5vw,40px)] font-black leading-[1.02] tracking-tight text-ink">
					<span className="text-brand-ink">{org.name}</span> ya está en la cancha.
				</h2>
				<p className="mb-7 max-w-[44ch] text-sm leading-relaxed text-ink-2">
					Cuenta, estilo, cancha, liga y horario — todo listo. Ahora solo faltan los equipos y
					jugadores para arrancar la primera jornada.
				</p>

				<div className="mb-7 flex flex-wrap items-center justify-center gap-2">
					<SummaryChip icon={MapPin} label={venue.name} />
					<SummaryChip icon={CalendarDays} label={`${league.name} · ${dayLabel}`} />
					<SummaryChip icon={Clock} label={hoursLabel} />
				</div>

				<BrowserPreviewFrame
					className="mb-8 w-full max-w-[420px]"
					slug={org.slug}
					orgName={org.name}
					logoUrl={logoUrl || undefined}
					tokens={tokens}
					fontFamily={fontFamily}
				/>

				<div className="flex flex-wrap items-center justify-center gap-3">
					<Link href="/admin">
						<Button variant="secondary" size="lg">
							Ir al panel
						</Button>
					</Link>
					<Link href={`/admin/leagues/${league.id}/setup`}>
						<Button variant="primary" size="lg">
							Configurar equipos y jugadores
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

function SummaryChip({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
	return (
		<span className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] text-ink-2">
			<Icon size={14} strokeWidth={2.25} className="text-brand-ink" />
			{label}
		</span>
	);
}
