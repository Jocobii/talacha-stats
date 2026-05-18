import type {
	CockpitMatchday,
	TeamWithAttendance,
	CockpitPairing,
	VenueOption,
	CockpitConfig,
} from "../types";

type CurrentResponse = {
	matchday: CockpitMatchday | null;
	totalMatchdays: number;
	leagueName: string;
	venues: VenueOption[];
	config: CockpitConfig | null;
};

type ApiResult<T> = { ok: boolean; data?: T };

/** Fetch con timeout para evitar que el spinner quede colgado indefinidamente. */
const COCKPIT_FETCH_TIMEOUT_MS = 15_000;

async function timedFetch(url: string, init?: RequestInit): Promise<Response> {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), COCKPIT_FETCH_TIMEOUT_MS);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(id);
	}
}

export async function fetchCurrent(leagueId: string): Promise<CurrentResponse | null> {
	const res = await timedFetch(`/api/leagues/${leagueId}/sorteo/current`);
	const json = (await res.json()) as ApiResult<CurrentResponse>;
	return json.ok && json.data ? json.data : null;
}

export async function fetchRoster(
	leagueId: string,
	matchdayNumber: number,
): Promise<TeamWithAttendance[]> {
	const res = await timedFetch(`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/roster`);
	const json = (await res.json()) as ApiResult<{ teams: TeamWithAttendance[] }>;
	return json.ok && json.data ? json.data.teams : [];
}

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

export async function fetchSortear(
	leagueId: string,
	matchdayNumber: number,
	seed?: number,
): Promise<SortearResponse | null> {
	const body: { seed?: number } = seed !== undefined ? { seed } : {};
	const res = await fetch(`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/sortear`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const json = (await res.json()) as ApiResult<SortearResponse>;
	return json.ok && json.data ? json.data : null;
}

export async function postConfirm(
	leagueId: string,
	matchdayNumber: number,
	seed: number,
	pairings: CockpitPairing[],
): Promise<void> {
	await fetch(`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/confirm`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			seed,
			pairings: pairings.map((p) => ({
				homeTeamId: p.homeTeamId,
				awayTeamId: p.awayTeamId,
				venueId: p.venueId,
				startTime: p.startTime,
			})),
		}),
	});
}

export async function postAttendance(
	leagueId: string,
	matchdayNumber: number,
	teamId: string,
	status: "presente" | "ausente",
): Promise<void> {
	await fetch(`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/attendance`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ teamId, status }),
	});
}

export async function postCreateMatchday(
	leagueId: string,
	scheduledDate: string,
): Promise<boolean> {
	const res = await fetch(`/api/leagues/${leagueId}/jornadas`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ scheduledDate }),
	});
	const json = (await res.json()) as { ok: boolean };
	return json.ok;
}

export async function postPublish(leagueId: string, matchdayNumber: number): Promise<void> {
	await fetch(`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/publish`, {
		method: "POST",
	});
}
