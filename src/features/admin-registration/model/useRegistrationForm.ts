"use client";

/**
 * features/admin-registration/model/useRegistrationForm.ts
 * Custom hook — encapsula todo el estado y efectos del formulario de registro.
 * Regla SRP: ningún componente de UI necesita useState/useEffect propios para esta feature.
 */

import { useState, useEffect, useRef } from "react";
import {
	CURP_REGEX,
	CURP_LENGTH,
	LOOKUP_DEBOUNCE_MS,
	LOOKUP_API_URL,
	REGISTER_API_URL,
	TEAMS_API_URL,
} from "../constants";
import { normalizeCurp, birthDateFromCurp } from "../lib/registration-utils";
import type { League, Team, GlobalPlayerData, RegistrationStep, RegistrationStage } from "../types";

// ── Tipos internos ─────────────────────────────────────────────────────────────

type SubmitPayload = {
	curp: string;
	fullName: string;
	birthDate: string;
	gender: string | null;
	leagueId: string | null;
	teamId: string | null;
	dorsal: number | null;
	internalNotes: string | null;
	phone: string | null;
	residenceArea: string | null;
	emergencyContactName: string | null;
	emergencyContactPhone: string | null;
	medicalNotes: string | null;
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export type UseRegistrationFormReturn = {
	// Estado de la CURP y resultado de búsqueda
	curp: string;
	setCurpInput: (val: string) => void;

	// Selección de liga / equipo / dorsal
	leagueId: string;
	teams: Team[];
	teamId: string;
	dorsal: string;
	selectedLeague: League | undefined;
	onLeagueChange: (id: string) => void;
	onTeamChange: (v: string) => void;
	onDorsalChange: (v: string) => void;

	// Campos del formulario de nuevo jugador
	fullName: string;
	lastName: string;
	birthDate: string;
	gender: string;
	onFullNameChange: (v: string) => void;
	onLastNameChange: (v: string) => void;
	onBirthDateChange: (v: string) => void;
	onGenderChange: (v: string) => void;

	// Datos de contacto — opcionales, "por si hay una emergencia"
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

	// Máquina de estado
	step: RegistrationStep;
	currentStage: RegistrationStage;

	// Conteo de sesión
	sessionCount: number;

	// Acciones
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	reset: () => void;

	// Ref para el input de CURP (auto-focus al hacer reset)
	curpInputRef: React.RefObject<HTMLInputElement | null>;
};

export function useRegistrationForm(
	fixedLeague?: League,
	leagues: League[] = [],
): UseRegistrationFormReturn {
	// ── State ──────────────────────────────────────────────────────────────────
	const [curp, setCurp] = useState("");
	const [leagueId, setLeagueId] = useState(fixedLeague?.id ?? "");
	const [teams, setTeams] = useState<Team[]>([]);
	const [teamId, setTeamId] = useState("");
	const [dorsal, setDorsal] = useState("");
	const [internalNotes, setInternalNotes] = useState("");
	const [fullName, setFullName] = useState("");
	const [lastName, setLastName] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const [gender, setGender] = useState("");
	const [phone, setPhone] = useState("");
	const [residenceArea, setResidenceArea] = useState("");
	const [emergencyContactName, setEmergencyContactName] = useState("");
	const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
	const [medicalNotes, setMedicalNotes] = useState("");
	const [sessionCount, setSessionCount] = useState(0);
	const [step, setStep] = useState<RegistrationStep>({ type: "idle" });

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const curpInputRef = useRef<HTMLInputElement | null>(null);

	// ── Derivados ──────────────────────────────────────────────────────────────
	const selectedLeague = fixedLeague ?? leagues.find((l) => l.id === leagueId);

	const currentStage: RegistrationStage =
		step.type === "found" || step.type === "not_found"
			? "review"
			: step.type === "submitting" || step.type === "success"
				? "done"
				: "search";

	// ── Cargar equipos cuando cambia la liga ───────────────────────────────────
	useEffect(() => {
		if (!leagueId) return;
		let cancelled = false;

		fetch(TEAMS_API_URL(leagueId))
			.then((r) => r.json())
			.then((d: { ok: boolean; data: Team[] }) => {
				if (!cancelled && d.ok) setTeams(d.data);
			})
			.catch(() => {
				if (!cancelled) setTeams([]);
			});

		return () => {
			cancelled = true;
		};
	}, [leagueId]);

	// ── Debounced lookup ───────────────────────────────────────────────────────
	useEffect(() => {
		const normalized = normalizeCurp(curp);
		const isValid = normalized.length === CURP_LENGTH && CURP_REGEX.test(normalized);
		if (!isValid) return;

		if (debounceRef.current) clearTimeout(debounceRef.current);

		debounceRef.current = setTimeout(async () => {
			setStep({ type: "searching" });
			try {
				const res = await fetch(LOOKUP_API_URL(normalized));
				const data = (await res.json()) as {
					ok: boolean;
					data: { found: boolean; player: GlobalPlayerData };
					error?: string;
				};

				if (!data.ok) {
					setStep({ type: "error", message: data.error ?? "Error al buscar el jugador" });
					return;
				}

				setStep(
					data.data.found ? { type: "found", player: data.data.player } : { type: "not_found" },
				);
			} catch {
				setStep({ type: "error", message: "Sin conexión — verifica la red" });
			}
		}, LOOKUP_DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [curp]);

	// ── Acciones ───────────────────────────────────────────────────────────────

	function setCurpInput(val: string): void {
		const up = val.toUpperCase().slice(0, CURP_LENGTH);
		setCurp(up);

		// Auto-rellenar fecha de nacimiento cuando la CURP está completa
		if (up.length === CURP_LENGTH) {
			const extracted = birthDateFromCurp(up);
			if (extracted) setBirthDate((prev) => prev || extracted);
		}

		if (up.length < CURP_LENGTH && step.type !== "idle") {
			setStep({ type: "idle" });
		}
	}

	function onLeagueChange(id: string): void {
		setLeagueId(id);
		setTeams([]);
		setTeamId("");
	}

	function reset(): void {
		setCurp("");
		setTeamId("");
		setDorsal("");
		setInternalNotes("");
		setFullName("");
		setLastName("");
		setBirthDate("");
		setGender("");
		setPhone("");
		setResidenceArea("");
		setEmergencyContactName("");
		setEmergencyContactPhone("");
		setMedicalNotes("");
		setStep({ type: "idle" });
		setTimeout(() => curpInputRef.current?.focus(), 50);
	}

	function buildPayload(): SubmitPayload {
		const normalized = normalizeCurp(curp);
		const isFound = step.type === "found";

		return {
			curp: normalized,
			fullName: isFound
				? (step as Extract<RegistrationStep, { type: "found" }>).player.fullName
				: `${fullName.trim()} ${lastName.trim()}`.trim(),
			birthDate: isFound
				? (step as Extract<RegistrationStep, { type: "found" }>).player.birthDate
				: birthDate,
			gender: isFound ? null : gender || null,
			// Liga y equipo son siempre opcionales — nunca bloquean el alta.
			leagueId: leagueId || null,
			teamId: teamId || null,
			dorsal: dorsal ? parseInt(dorsal, 10) : null,
			internalNotes: internalNotes.trim() || null,
			phone: phone.trim() || null,
			residenceArea: residenceArea.trim() || null,
			emergencyContactName: emergencyContactName.trim() || null,
			emergencyContactPhone: emergencyContactPhone.trim() || null,
			medicalNotes: medicalNotes.trim() || null,
		};
	}

	async function handleSubmit(e: React.FormEvent): Promise<void> {
		e.preventDefault();

		setStep({ type: "submitting" });

		try {
			const res = await fetch(REGISTER_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildPayload()),
			});
			const data = (await res.json()) as { ok: boolean; data: unknown; error?: string };

			if (!data.ok) {
				setStep({ type: "error", message: data.error ?? "Error al registrar" });
				return;
			}

			setSessionCount((c) => c + 1);
			setStep({ type: "success", data: data.data as never });
		} catch {
			setStep({ type: "error", message: "Sin conexión — el registro no se completó" });
		}
	}

	return {
		curp,
		setCurpInput,
		leagueId,
		teams,
		teamId,
		dorsal,
		selectedLeague,
		onLeagueChange,
		onTeamChange: setTeamId,
		onDorsalChange: setDorsal,
		fullName,
		lastName,
		birthDate,
		gender,
		onFullNameChange: setFullName,
		onLastNameChange: setLastName,
		onBirthDateChange: setBirthDate,
		onGenderChange: setGender,
		phone,
		residenceArea,
		emergencyContactName,
		emergencyContactPhone,
		medicalNotes,
		onPhoneChange: setPhone,
		onResidenceAreaChange: setResidenceArea,
		onEmergencyContactNameChange: setEmergencyContactName,
		onEmergencyContactPhoneChange: setEmergencyContactPhone,
		onMedicalNotesChange: setMedicalNotes,
		step,
		currentStage,
		sessionCount,
		handleSubmit,
		reset,
		curpInputRef,
	};
}
