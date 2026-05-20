"use client";

/**
 * features/league-onboarding/ui/StepPlayers.tsx
 * Paso 1 del wizard — ventanilla de registro de jugadores por equipo.
 */

import { ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { MiniStat, WizardFooter } from "./WizardShared";
import { REGISTRATION_URL } from "../constants";
import type { CreatedTeam, League } from "../types";

type Props = {
	league: League;
	teams: CreatedTeam[];
	onBack: () => void;
	onNext: () => void;
};

export function StepPlayers({ league, teams, onBack, onNext }: Props) {
	return (
		<div className="flex flex-col gap-6">
			<Card className="p-6">
				<h3 className="font-display text-[22px] text-ink font-bold tracking-tight">
					Registra jugadores en ventanilla
				</h3>
				<p className="text-sm text-ink-2 mt-1 mb-5 max-w-[640px]">
					Abre la ventanilla de registro y captura jugadores con su CURP. Cada jugador queda
					asignado a un equipo.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
					<div className="flex-1 grid grid-cols-2 gap-3">
						<MiniStat label="Equipos" value={teams.length} />
						<MiniStat label="Jugadores registrados" value={0} brand />
					</div>
					<a
						href={REGISTRATION_URL(league.id)}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition shrink-0"
					>
						<UserPlus size={16} strokeWidth={1.75} />
						Abrir ventanilla
						<ArrowRight size={14} strokeWidth={2} />
					</a>
				</div>
			</Card>

			{/* Teams progress overview */}
			<Card className="overflow-hidden">
				<div className="px-6 py-3 border-b border-line flex items-center justify-between bg-surface-2/40">
					<SectionLabel>Avance por equipo</SectionLabel>
					<span className="text-[11px] text-ink-3">{teams.length} equipos · 0 jugadores</span>
				</div>
				<ul>
					{teams.map((t) => (
						<li
							key={t.id}
							className="flex items-center gap-4 px-6 py-3.5 border-b border-line last:border-b-0"
						>
							<span
								className="w-8 h-8 rounded-md grid place-items-center text-pitch font-display font-bold text-[13px] shrink-0"
								style={{ background: t.color ?? "#00E676" }}
							>
								{t.name.slice(0, 1).toUpperCase()}
							</span>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-3">
									<span className="text-[14px] font-medium text-ink truncate">{t.name}</span>
									<span className="text-[12px] font-mono text-ink-3">0 jug.</span>
								</div>
								<div className="mt-2 h-1 bg-surface-2 rounded-full overflow-hidden">
									<div className="h-full bg-brand" style={{ width: "0%" }} />
								</div>
							</div>
							<a
								href={REGISTRATION_URL(league.id, t.id)}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 h-7 px-3 text-[12px] font-medium rounded-md text-ink-2 border border-line hover:border-ink-3 hover:text-ink transition"
							>
								Registrar <ArrowRight size={12} strokeWidth={2} />
							</a>
						</li>
					))}
				</ul>
			</Card>

			<WizardFooter
				leftHint="Cuando termines de registrar los jugadores, continúa."
				secondary={
					<Button variant="secondary" size="md" icon={ArrowLeft} onClick={onBack}>
						Atrás
					</Button>
				}
				primary={
					<Button variant="primary" size="md" iconRight={ArrowRight} onClick={onNext}>
						Ya registré los jugadores
					</Button>
				}
			/>
		</div>
	);
}
