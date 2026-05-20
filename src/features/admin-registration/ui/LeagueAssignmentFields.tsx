"use client";

/**
 * features/admin-registration/ui/LeagueAssignmentFields.tsx
 * Bloque reutilizable: selector de liga + equipo + dorsal.
 * Usado por PlayerFoundCard y NewPlayerCard.
 */

import { Hash } from "lucide-react";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import type { AssignmentFieldsProps } from "../types";

export function LeagueAssignmentFields({
	fixedLeague,
	leagues,
	leagueId,
	teams,
	teamId,
	dorsal,
	onLeagueChange,
	onTeamChange,
	onDorsalChange,
}: AssignmentFieldsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_160px] gap-3">
			{fixedLeague ? (
				<div className="flex items-center gap-2 text-sm text-ink-2 h-9 px-3 rounded-md bg-surface-2 border border-line">
					{fixedLeague.name}
					<span className="text-ink-3">&middot; {fixedLeague.season}</span>
				</div>
			) : (
				<Field label="Liga" required>
					<Select value={leagueId} onChange={(e) => onLeagueChange(e.target.value)}>
						<option value="">— Seleccionar liga —</option>
						{leagues.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name} &middot; {l.season}
							</option>
						))}
					</Select>
				</Field>
			)}

			<Field label="Equipo">
				<Select value={teamId} onChange={(e) => onTeamChange(e.target.value)} disabled={!leagueId}>
					<option value="">— Sin asignar —</option>
					{teams.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
						</option>
					))}
				</Select>
			</Field>

			<Field label="Dorsal" hint="Opcional">
				<Input
					placeholder="10"
					value={dorsal}
					onChange={(e) => onDorsalChange(e.target.value)}
					mono
					maxLength={2}
					icon={Hash}
					type="number"
					min={1}
					max={99}
				/>
			</Field>
		</div>
	);
}
