/**
 * features/match-resolution/types.ts
 * Tipos compartidos del feature de Resolución de Partidos.
 */
import type { MatchPlayerStatInput, MatchResolutionData } from "@/entities/match/model";
import type { StatColumn } from "./constants";

export type { MatchPlayerStatInput, MatchResolutionData };

/** Estado local de la pantalla de captura */
export type ResolutionState = {
	matchId: string;
	status: string;
	homeScore: number | null;
	awayScore: number | null;
	homeBonusGoals: number;
	awayBonusGoals: number;
	refereeObservations: string | null;
	homePlayers: PlayerStatDraft[];
	awayPlayers: PlayerStatDraft[];
};

/** Draft de stats de un jugador en la pantalla de captura */
export type PlayerStatDraft = {
	registrationId: string;
	playerProfileId: string | null;
	fullName: string;
	jerseyNumber: number | null;
	/** Código de credencial (mismo que en la cédula impresa). null = ad-hoc/sin credencial. */
	credentialCode: number | null;
	isAdHoc: boolean;
	isPresent: boolean;
	shirtNumber: number | null;
	goals: number;
	assists: number;
	yellowCards: number;
	blueCards: number;
	redCards: number;
	/** true = hay cambios no guardados */
	dirty: boolean;
};

export type TeamSide = "home" | "away";

export type UpdatePlayerStatPayload = {
	side: TeamSide;
	registrationId: string;
	field: StatColumn | "isPresent" | "shirtNumber";
	value: number | boolean;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";
