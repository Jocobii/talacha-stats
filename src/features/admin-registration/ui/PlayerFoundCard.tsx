"use client";

/**
 * features/admin-registration/ui/PlayerFoundCard.tsx
 * Estado: jugador encontrado en la base nacional.
 * Muestra identidad verificada (con CURP e historial) + asignación a liga/equipo.
 */

import { User, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { formatDateEs, getPlayerInitials } from "../lib/registration-utils";
import { LeagueAssignmentFields } from "./LeagueAssignmentFields";
import type { GlobalPlayerData, AssignmentFieldsProps } from "../types";

type Props = AssignmentFieldsProps & {
	player: GlobalPlayerData;
	curp: string;
	onSubmit: (e: React.FormEvent) => void;
	onReset: () => void;
	submitting: boolean;
};

export function PlayerFoundCard({
	player,
	curp,
	fixedLeague,
	leagues,
	leagueId,
	league,
	teams,
	teamId,
	dorsal,
	onLeagueChange,
	onTeamChange,
	onDorsalChange,
	onSubmit,
	onReset,
	submitting,
}: Props) {
	const leagueHistoryLabel =
		player.previousLeaguesCount === 0
			? "Primera vez"
			: `${player.previousLeaguesCount} temporada${player.previousLeaguesCount !== 1 ? "s" : ""}`;

	return (
		<form onSubmit={onSubmit}>
			<Card className="overflow-hidden">
				{/* Banner */}
				<div className="flex items-center gap-2 px-6 py-3 border-b border-line bg-brand/[0.05]">
					<span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_8px_rgba(0,230,118,.7)] shrink-0" />
					<span className="text-[12px] font-semibold text-brand-ink">
						Jugador encontrado en la base nacional
					</span>
				</div>

				<div className="p-6 sm:p-7">
					<div className="flex flex-col sm:flex-row gap-6">
						<Avatar initials={getPlayerInitials(player.fullName)} size="xl" />
						<div className="flex-1 min-w-0">
							<SectionLabel>Identidad verificada</SectionLabel>
							<h2 className="font-display text-[28px] text-ink sm:text-[32px] tracking-tight leading-none mt-1.5 break-words">
								{player.fullName.toUpperCase()}
							</h2>
							<p className="text-sm text-ink-2 mt-2">{formatDateEs(player.birthDate)}</p>

							{/* KV: CURP · Fecha de nacimiento · Ligas previas */}
							<dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
								<KV label="CURP" value={curp} mono />
								<KV label="Fecha de nacimiento" value={formatDateEs(player.birthDate)} />
								<KV label="Ligas previas" value={leagueHistoryLabel} />
							</dl>

							{/* Badges */}
							<div className="mt-4 flex flex-wrap gap-2">
								<Badge tone="neutral">
									<User size={10} strokeWidth={2} className="mr-0.5" />
									Jugador registrado
								</Badge>
								{player.previousLeaguesCount >= 2 && <Badge tone="neutral">Multiligas</Badge>}
							</div>
						</div>
					</div>

					{/* Asignación a liga y equipo */}
					<div className="mt-7 pt-7 border-t border-line">
						<SectionLabel className="mb-3">
							Paso 2 &middot; Liga y equipo{" "}
							<span className="normal-case font-normal text-ink-3 tracking-normal">
								&mdash; opcional
							</span>
						</SectionLabel>
						<LeagueAssignmentFields
							fixedLeague={fixedLeague}
							leagues={leagues}
							leagueId={leagueId}
							teams={teams}
							teamId={teamId}
							dorsal={dorsal}
							onLeagueChange={onLeagueChange}
							onTeamChange={onTeamChange}
							onDorsalChange={onDorsalChange}
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-line bg-surface-2/40 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<Button variant="ghost" size="md" type="button" onClick={onReset}>
						Buscar otro CURP
					</Button>
					<div className="flex gap-2">
						<Button variant="secondary" size="md" type="button" onClick={onReset}>
							No es él/ella
						</Button>
						<Button
							variant="primary"
							size="md"
							iconRight={ArrowRight}
							type="submit"
							disabled={submitting}
						>
							{league ? `Registrar en ${league.name}` : "Registrar sin liga"}
						</Button>
					</div>
				</div>
			</Card>
		</form>
	);
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
	return (
		<div className="bg-surface-2/40 border border-line rounded-md px-3 py-2.5">
			<dt className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">{label}</dt>
			<dd className={`mt-1 text-[14px] text-ink${mono ? " font-mono tracking-wider" : ""}`}>
				{value}
			</dd>
		</div>
	);
}
