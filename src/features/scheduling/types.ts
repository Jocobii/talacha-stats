// features/scheduling/types.ts
// Tipos compartidos del módulo de sorteo.
// Los tipos de DB se infieren desde schema.ts; estos son tipos de dominio internos.

import type { SchedulingPhase, ChangeType } from "./constants";

/** Par de equipos para una jornada. null = BYE (equipo descansa). */
export type Pairing = {
	homeTeamId: string;
	awayTeamId: string | null; // null = BYE
};

/** Jornada generada (sin persistir) */
export type GeneratedMatchday = {
	number: number;
	phase: SchedulingPhase;
	pairings: Pairing[];
};

/** Slot de tiempo disponible en una cancha para un día dado */
export type TimeSlot = {
	venueId: string;
	startTime: string; // "HH:MM"
	endTime: string; // "HH:MM"
};

/** Partido asignado a un slot (sin persistir) */
export type AssignedMatch = {
	pairing: Pairing;
	slot: TimeSlot;
	matchdayNumber: number;
};

/** Conflicto de horario comprado entre dos equipos */
export type SlotConflict = {
	pairing: Pairing;
	teamAId: string;
	teamATime: string;
	teamBId: string;
	teamBTime: string;
	reason: string;
};

/** Resultado del generador completo (preview, sin persistir) */
export type GeneratedSchedule = {
	matchdays: GeneratedMatchday[];
	assigned: AssignedMatch[];
	conflicts: SlotConflict[];
	unassigned: Pairing[];
	seed: number;
};

/** Déficit de partidos de un equipo */
export type TeamDeficit = {
	teamId: string;
	played: number;
	target: number;
	missingOpponents: string[];
};

/** Entrada del override engine para audit log */
export type OverrideRecord = {
	matchId: string;
	changedBy: string | null;
	changeType: ChangeType;
	previousValue: Record<string, unknown>;
	newValue: Record<string, unknown>;
	reason?: string;
};
