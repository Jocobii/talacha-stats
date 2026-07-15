"use client";

/**
 * features/admin-registration/ui/NewPlayerCard.tsx
 * Estado: CURP no encontrada — formulario de alta manual.
 */

import { useState } from "react";
import { AlertCircle, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { cn } from "@/shared/lib/cn";
import { LeagueAssignmentFields } from "./LeagueAssignmentFields";
import type { AssignmentFieldsProps } from "../types";

type Props = AssignmentFieldsProps & {
	curp: string;
	fullName: string;
	lastName: string;
	birthDate: string;
	gender: string;
	onFullNameChange: (v: string) => void;
	onLastNameChange: (v: string) => void;
	onBirthDateChange: (v: string) => void;
	onGenderChange: (v: string) => void;
	phone: string;
	residenceArea: string;
	emergencyContactName: string;
	emergencyContactPhone: string;
	medicalNotes: string;
	onPhoneChange: (v: string) => void;
	onResidenceAreaChange: (v: string) => void;
	onEmergencyContactNameChange: (v: string) => void;
	onEmergencyContactPhoneChange: (v: string) => void;
	onMedicalNotesChange: (v: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
	submitting: boolean;
};

export function NewPlayerCard({
	curp,
	fullName,
	lastName,
	birthDate,
	gender,
	fixedLeague,
	leagues,
	leagueId,
	teams,
	teamId,
	dorsal,
	onLeagueChange,
	onFullNameChange,
	onLastNameChange,
	onBirthDateChange,
	onGenderChange,
	phone,
	residenceArea,
	emergencyContactName,
	emergencyContactPhone,
	medicalNotes,
	onPhoneChange,
	onResidenceAreaChange,
	onEmergencyContactNameChange,
	onEmergencyContactPhoneChange,
	onMedicalNotesChange,
	onTeamChange,
	onDorsalChange,
	onSubmit,
	onCancel,
	submitting,
}: Props) {
	// Colapsable — sección "opcional, por si hay una emergencia" empieza cerrada.
	const [contactOpen, setContactOpen] = useState(false);

	const canSubmit =
		!submitting && !!fullName.trim() && !!lastName.trim() && !!birthDate && !!gender;

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
						<Field label="Nombre(s)" required>
							<Input
								placeholder="Margarita"
								value={fullName}
								onChange={(e) => onFullNameChange(e.target.value)}
								required
							/>
						</Field>
						<Field label="Apellidos" required>
							<Input
								placeholder="Gutiérrez Hernández"
								value={lastName}
								onChange={(e) => onLastNameChange(e.target.value)}
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
						<Field label="Género" required>
							<Select value={gender} onChange={(e) => onGenderChange(e.target.value)} required>
								<option value="">&mdash; Seleccionar &mdash;</option>
								<option value="masculino">Masculino</option>
								<option value="femenino">Femenino</option>
								<option value="otro">Otro</option>
							</Select>
						</Field>
						<Field
							label="CURP"
							hint="Capturada arriba — se guardará al confirmar"
							className="sm:col-span-2"
						>
							<Input value={curp} readOnly mono className="opacity-70 cursor-default" />
						</Field>
					</div>

					{/* Datos de contacto — opcional, por si hay una emergencia */}
					<div className="mt-7 pt-7 border-t border-line">
						<button
							type="button"
							onClick={() => setContactOpen((v) => !v)}
							className="flex items-center gap-1.5 text-left"
							aria-expanded={contactOpen}
						>
							<ChevronDown
								size={14}
								strokeWidth={2}
								className={cn("text-ink-3 transition-transform", contactOpen && "rotate-180")}
							/>
							<SectionLabel className="mb-0">
								Datos de contacto{" "}
								<span className="normal-case font-normal text-ink-3 tracking-normal">
									&mdash; opcional, por si hay una emergencia
								</span>
							</SectionLabel>
						</button>

						{contactOpen && (
							<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Field label="Teléfono" hint="Del jugador">
									<Input
										placeholder="684 123 4567"
										value={phone}
										onChange={(e) => onPhoneChange(e.target.value)}
									/>
								</Field>
								<Field label="Ciudad / colonia de residencia">
									<Input
										placeholder="Tijuana, Cacho"
										value={residenceArea}
										onChange={(e) => onResidenceAreaChange(e.target.value)}
									/>
								</Field>
								<Field label="Contacto de emergencia" hint="A quién llamar">
									<Input
										placeholder="Ej. madre, esposo — nombre"
										value={emergencyContactName}
										onChange={(e) => onEmergencyContactNameChange(e.target.value)}
									/>
								</Field>
								<Field label="Teléfono de emergencia">
									<Input
										placeholder="684 987 6543"
										value={emergencyContactPhone}
										onChange={(e) => onEmergencyContactPhoneChange(e.target.value)}
									/>
								</Field>
								<Field
									label="Notas médicas"
									hint="Alergias, tipo de sangre, condición — opcional"
									className="sm:col-span-2"
								>
									<Input
										placeholder="Ej. alérgico a penicilina, tipo O+"
										value={medicalNotes}
										onChange={(e) => onMedicalNotesChange(e.target.value)}
									/>
								</Field>
							</div>
						)}
					</div>

					<div className="mt-7 pt-7 border-t border-line">
						<SectionLabel className="mb-3">
							Paso 3 &middot; Liga y equipo{" "}
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
