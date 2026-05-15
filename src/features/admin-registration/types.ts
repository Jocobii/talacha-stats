/**
 * features/admin-registration/types.ts
 * Tipos compartidos de la feature. No duplicar en subcomponentes.
 */

export type League = {
	id: string;
	name: string;
	season: string;
};

export type Team = {
	id: string;
	name: string;
};

export type GlobalPlayerData = {
	id: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	createdAt: string;
	/** Cantidad de ligas en las que el jugador ya ha participado históricamente. */
	previousLeaguesCount: number;
};

export type SuccessData = {
	isNew: boolean;
	globalPlayer: GlobalPlayerData;
	leagueMember: {
		id: string;
		dorsal: number | null;
		inscriptionDate: string;
	};
	inscription: { teamId: string } | null;
};

export type RegistrationStep =
	| { type: "idle" }
	| { type: "searching" }
	| { type: "found"; player: GlobalPlayerData }
	| { type: "not_found" }
	| { type: "submitting" }
	| { type: "success"; data: SuccessData }
	| { type: "error"; message: string };

export type RegistrationStage = "search" | "review" | "done";

/** Props comunes a todos los subcomponentes de asignación */
export type AssignmentFieldsProps = {
	fixedLeague?: League;
	leagues: League[];
	leagueId: string;
	league?: League;
	teams: Team[];
	teamId: string;
	dorsal: string;
	onLeagueChange: (id: string) => void;
	onTeamChange: (v: string) => void;
	onDorsalChange: (v: string) => void;
};
