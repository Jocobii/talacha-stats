"use client";

/**
 * features/admin-registration/ui/NewPlayerCard.tsx
 * Estado: CURP no encontrada — formulario de alta manual.
 */

import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { LeagueAssignmentFields } from "./LeagueAssignmentFields";
import type { AssignmentFieldsProps } from "../types";

type Props = AssignmentFieldsProps & {
	curp: string;
	fullName: string;
	birthDate: string;
	onFullNameChange: (v: string) => void;
	onBirthDateChange: (v: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
	submitting: boolean;
};

export function NewPlayerCard({
	curp,
	fullName,
	birthDate,
	fixedLeague,
	leagues,
	leagueId,
	teams,
	teamId,
	dorsal,
	onLeagueChange,
	onFullNameChange,
	onBirthDateChange,
	onTeamChange,
	onDorsalChange,
	onSubmit,
	onCancel,
	submitting,
}: Props) {
	const canSubmit = !submitting && !!leagueId && !!fullName.trim() && !!birthDate;

	return (
		<form onSubmit={onSubmit}>
			<Card className="overflow-hidden">
				<div className="flex items-center gap-2 px-6 py-3 border-b border-line bg-amber-500/[0.06]">
					<AlertCircle size={14} strokeWidth={2} className="text-amber-300" />
					<span className="text-[12px] font-semibold text-amber-300">
						CURP no encontrada &mdash; crear jugador nuevo
					</span>
				</div>

				<div className="p-6 sm:p-7">
					<SectionLabel>Paso 2 &middot; Datos del jugador</SectionLabel>
					<h2 className="font-display text-[28px] text-ink font-bold tracking-tight mt-1">
						Registro manual
					</h2>
					<p className="text-sm text-ink-2 mt-1.5 max-w-md">
						Crea el jugador en la base. Captura lo básico &mdash; los datos avanzados se completan
						después.
					</p>

					<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Field
							label="Nombre completo"
							hint="Como aparece en INE"
							required
							className="sm:col-span-2"
						>
							<Input
								placeholder="Margarita Gutiérrez Hernández"
								value={fullName}
								onChange={(e) => onFullNameChange(e.target.value)}
								required
							/>
						</Field>
						<Field label="Fecha de nacimiento" required>
							<Input
								type="date"
								value={birthDate}
								onChange={(e) => onBirthDateChange(e.target.value)}
								max={new Date().toISOString().slice(0, 10)}
								required
							/>
						</Field>
						<Field label="CURP" hint="Capturada arriba — se guardará al confirmar">
							<Input value={curp} readOnly mono className="opacity-70 cursor-default" />
						</Field>
					</div>

					<div className="mt-7 pt-7 border-t border-line">
						<SectionLabel className="mb-3">Paso 3 &middot; Asignar a liga y equipo</SectionLabel>
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

				<div className="px-6 py-4 border-t border-line bg-surface-2/40 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<Button variant="ghost" size="md" type="button" onClick={onCancel}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						size="md"
						iconRight={ArrowRight}
						type="submit"
						disabled={!canSubmit}
					>
						Crear y registrar
					</Button>
				</div>
			</Card>
		</form>
	);
}
