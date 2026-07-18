import { apiFetch } from "@/shared/api/client";
import { SCHEDULING_CONFIG_URL, SCHEDULING_CONFIG_FIXED } from "../constants";
import type {
	CockpitMatchday,
	TeamWithAttendance,
	CockpitPairing,
	VenueOption,
	CockpitConfig,
} from "../types";

// ── Tipos de respuesta ────────────────────────────────────────────────────────

type CurrentResponse = {
	matchday: CockpitMatchday | null;
	suggestedNextDate: string | null;
	totalMatchdays: number;
	leagueName: string;
	teamsCount: number;
	venues: VenueOption[];
	config: CockpitConfig | null;
};

type RosterResponse = {
	teams: TeamWithAttendance[];
	allRecentPairKeys: string[];
};

type SortearResponse = {
	seed: number;
	pairings: Array<{
		homeTeamId: string;
		awayTeamId: string | null;
		venueId: string | null;
		startTime: string | null;
		isConflict: boolean;
	}>;
};

type PairingsResponse = { pairings: CockpitPairing[] };

// ── Helpers internos ──────────────────────────────────────────────────────────

/** Lanza si la respuesta es error — permite usar try/catch en el hook. */
function unwrap<T>(result: Awaited<ReturnType<typeof apiFetch<T>>>): T {
	if (!result.ok) throw new Error(result.error);
	return result.data;
}

// ── Funciones públicas ────────────────────────────────────────────────────────

export async function fetchCurrent(leagueId: string): Promise<CurrentResponse | null> {
	const result = await apiFetch<CurrentResponse>(`/api/leagues/${leagueId}/sorteo/current`);
	return result.ok ? result.data : null;
}

export async function fetchRoster(
	leagueId: string,
	matchdayNumber: number,
): Promise<{ teams: TeamWithAttendance[]; allRecentPairKeys: string[] }> {
	const result = await apiFetch<RosterResponse>(
		`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/roster`,
	);
	return result.ok
		? { teams: result.data.teams, allRecentPairKeys: result.data.allRecentPairKeys }
		: { teams: [], allRecentPairKeys: [] };
}

export async function fetchSortear(
	leagueId: string,
	matchdayNumber: number,
	seed?: number,
): Promise<SortearResponse | null> {
	const result = await apiFetch<SortearResponse>(
		`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/sortear`,
		{ method: "POST", body: seed !== undefined ? { seed } : {} },
	);
	return result.ok ? result.data : null;
}

export async function postConfirm(
	leagueId: string,
	matchdayNumber: number,
	seed: number,
	pairings: CockpitPairing[],
): Promise<void> {
	const result = await apiFetch<unknown>(
		`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/confirm`,
		{
			method: "POST",
			body: {
				seed,
				pairings: pairings.map((p) => ({
					homeTeamId: p.homeTeamId,
					awayTeamId: p.awayTeamId,
					venueId: p.venueId,
					startTime: p.startTime,
				})),
			},
		},
	);
	unwrap(result);
}

export async function postAttendance(
	leagueId: string,
	matchdayNumber: number,
	teamId: string,
	status: "presente" | "ausente",
): Promise<void> {
	await apiFetch<unknown>(`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/attendance`, {
		method: "PATCH",
		body: { teamId, status },
	});
}

export async function postCreateMatchday(
	leagueId: string,
	scheduledDate: string,
): Promise<boolean> {
	const result = await apiFetch<unknown>(`/api/leagues/${leagueId}/jornadas`, {
		method: "POST",
		body: { scheduledDate },
	});
	return result.ok;
}

export async function postPublish(leagueId: string, matchdayNumber: number): Promise<void> {
	const result = await apiFetch<unknown>(
		`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/publish`,
		{ method: "POST" },
	);
	unwrap(result);
}

/**
 * Crea o actualiza la config de sorteo (PUT). Centraliza la construcción del body
 * (config de UI + valores fijos) que antes duplicaban ParametrosTab/Wizard con
 * `fetch()` desnudo. Lanza `Error(res.error)` en `!ok` (§18.4).
 */
export async function putSchedulingConfig(leagueId: string, config: CockpitConfig): Promise<void> {
	const result = await apiFetch<unknown>(SCHEDULING_CONFIG_URL(leagueId), {
		method: "PUT",
		body: { ...config, ...SCHEDULING_CONFIG_FIXED },
	});
	unwrap(result);
}

export async function fetchPairings(
	leagueId: string,
	matchdayNumber: number,
): Promise<CockpitPairing[]> {
	const result = await apiFetch<PairingsResponse>(
		`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/pairings`,
	);
	return result.ok ? result.data.pairings : [];
}
