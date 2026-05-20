"use client";

/**
 * features/league-onboarding/ui/StepDone.tsx
 * Paso 2 del wizard — confirmación y accesos rápidos post-configuración.
 */

import Link from "next/link";
import { Check, Upload, ArrowRight } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import type { CreatedTeam, League } from "../types";

type Props = {
	league: League;
	teams: CreatedTeam[];
};

const NEXT_ACTIONS = (league: League) => [
	{
		href: `/admin/registro?leagueId=${league.id}`,
		label: "Registrar más jugadores",
		desc: "Agrega más participantes cuando se inscriban.",
	},
	{
		href: `/admin/teams?leagueId=${league.id}`,
		label: "Ver plantillas de equipos",
		desc: "Revisa los jugadores inscritos por equipo.",
	},
];

export function StepDone({ league, teams }: Props) {
	return (
		<Card className="p-10 sm:p-12 text-center relative overflow-hidden">
			{/* Radial glow */}
			<div
				className="absolute inset-0 -z-10 opacity-[0.07] pointer-events-none"
				style={{
					background: "radial-gradient(500px 200px at 50% 0%, #00E676 0%, transparent 70%)",
				}}
			/>

			<div className="w-14 h-14 rounded-full bg-brand/15 border border-brand/30 grid place-items-center mx-auto mb-5">
				<Check size={26} strokeWidth={2.5} className="text-brand" />
			</div>

			<h2 className="font-display text-[36px] sm:text-[44px] leading-[0.95] text-ink tracking-tight">
				Liga lista.
			</h2>
			<p className="text-[15px] text-ink-2 mt-3 max-w-md mx-auto">
				<strong className="text-ink">{league.name}</strong> está configurada con{" "}
				<strong className="text-ink">{teams.length} equipos</strong>. Ya puedes capturar tu primera
				jornada.
			</p>

			<div className="mt-7 flex flex-wrap items-center justify-center gap-3">
				<Link
					href={`/admin/imports?leagueId=${league.id}`}
					className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition"
				>
					<Upload size={16} strokeWidth={1.75} />
					Capturar primera jornada
					<ArrowRight size={14} strokeWidth={2} />
				</Link>
				<Link
					href={`/admin/leagues/${league.id}`}
					className="inline-flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-md bg-surface-2 border border-line text-ink hover:border-ink-3 transition"
				>
					Ver liga
				</Link>
			</div>

			<div className="mt-8 pt-8 border-t border-line max-w-md mx-auto">
				<p className="text-[11px] text-ink-3 mb-4">¿Qué puedes hacer ahora?</p>
				<div className="flex flex-col gap-2 text-left">
					{NEXT_ACTIONS(league).map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="flex items-center justify-between p-3 rounded-md border border-line hover:bg-surface-2 transition group"
						>
							<div>
								<p className="text-[13px] font-medium text-ink group-hover:text-brand transition">
									{item.label}
								</p>
								<p className="text-[11px] text-ink-3 mt-0.5">{item.desc}</p>
							</div>
							<ArrowRight
								size={13}
								strokeWidth={2}
								className="text-ink-3 group-hover:text-brand transition"
							/>
						</Link>
					))}
				</div>
			</div>
		</Card>
	);
}
