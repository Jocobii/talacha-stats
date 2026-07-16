/**
 * features/cedula/lib/build-cedula-view-model.ts
 * View-model puro y client-safe (sin `@/db`) de UNA hoja de cédula, a partir
 * de `CedulaMatchData` (entities/match). Calcula renglones en blanco y
 * densidad para que quepa en una hoja Carta (docs/PLAN-CEDULA-IMPRESA.md §3.3,
 * §5). No pinta nada — eso es `ui/CedulaSheet.tsx` (paso 4).
 */
import type { CedulaMatchData, CedulaPlayerRow } from "@/entities/match";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** `isoDate` es "YYYY-MM-DD" (columna `date`) — parseo manual, sin timezone shifts (mismo patrón que fmtIsoDate). */
function formatMatchDateLabel(isoDate: string): string {
	const [year, month, day] = isoDate.split("-").map(Number);
	const utcDate = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
	return `${WEEKDAYS[utcDate.getUTCDay()]} ${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

function formatKickoffLabel(kickoffAt: Date | null): string {
	if (!kickoffAt) return "";
	return kickoffAt.toLocaleTimeString("es-MX", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function formatCredentialCode(code: number): string {
	return String(code).padStart(4, "0");
}

// --- Renglones en blanco + densidad (§3.3) ---------------------------------

/** Mínimo de renglones "Refuerzos / no registrados" por equipo, siempre presentes. */
const MIN_BLANK_ROWS = 5;
/** Filas por columna hasta las que la hoja se ve cómoda sin reducir tamaño. */
const COMFORTABLE_MAX_ROWS = 18;
/** Filas por columna hasta las que "compact" todavía cabe en una hoja. */
const COMPACT_MAX_ROWS = 24;
/** Filas por columna hasta las que "tight" todavía cabe en una hoja; más que esto, fluye a una 2ª hoja. */
const TIGHT_MAX_ROWS = 30;

export type CedulaDensity = "normal" | "compact" | "tight";

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function resolveDensity(targetRows: number): CedulaDensity {
	if (targetRows <= COMFORTABLE_MAX_ROWS) return "normal";
	if (targetRows <= COMPACT_MAX_ROWS) return "compact";
	return "tight";
}

// --- Filas de jugador --------------------------------------------------

export type CedulaPlayerRowVM = {
	kind: "player";
	credentialCode: string;
	fullName: string;
	dorsal: string;
	suspended: { tag: string; why: string } | null;
};

export type CedulaBlankRowVM = { kind: "blank" };

export type CedulaRowVM = CedulaPlayerRowVM | CedulaBlankRowVM;

function toPlayerRowVM(p: CedulaPlayerRow): CedulaPlayerRowVM {
	return {
		kind: "player",
		credentialCode: formatCredentialCode(p.credentialCode),
		fullName: p.fullName,
		dorsal: p.dorsal !== null ? String(p.dorsal) : "",
		suspended: p.suspended,
	};
}

export type CedulaTeamVM = {
	label: "LOCAL" | "VISITANTE";
	teamName: string;
	rows: CedulaRowVM[];
};

function buildTeamVM(
	label: "LOCAL" | "VISITANTE",
	teamName: string,
	roster: CedulaPlayerRow[],
	blankRows: number,
): CedulaTeamVM {
	const rows: CedulaRowVM[] = roster.map(toPlayerRowVM);
	for (let i = 0; i < blankRows; i++) rows.push({ kind: "blank" });
	return { label, teamName, rows };
}

export type CedulaSheetVM = {
	matchId: string;
	folio: string;
	leagueName: string;
	/** Chips del encabezado (categoría/temporada), sin vacíos. */
	chips: string[];
	matchdayLabel: string;
	dateLabel: string;
	timeLabel: string;
	venueLabel: string;
	home: CedulaTeamVM;
	away: CedulaTeamVM;
	density: CedulaDensity;
	/** true si el roster es tan grande que no cabe ni en modo "tight" — la 2ª hoja repite el encabezado (fuera del alcance de este view-model, lo resuelve CedulaSheet/CSS). */
	overflowsToSecondPage: boolean;
};

/** Construye el view-model de una hoja a partir de la data cruda del partido. */
export function buildCedulaViewModel(data: CedulaMatchData): CedulaSheetVM {
	const registeredHome = data.homePlayers.length;
	const registeredAway = data.awayPlayers.length;
	const maxRegistered = Math.max(registeredHome, registeredAway);
	const targetRows = maxRegistered + MIN_BLANK_ROWS;

	const blanksFor = (registered: number) =>
		clamp(targetRows - registered, MIN_BLANK_ROWS, targetRows);

	const chips = [data.league.category, `Temporada ${data.league.season}`].filter(
		(c): c is string => !!c && c.trim().length > 0,
	);

	return {
		matchId: data.matchId,
		folio: data.cedula ?? "—",
		leagueName: data.league.name,
		chips,
		matchdayLabel: data.matchdayNumber !== null ? `Jornada ${data.matchdayNumber}` : "—",
		dateLabel: formatMatchDateLabel(data.matchDate),
		timeLabel: formatKickoffLabel(data.kickoffAt),
		venueLabel: data.venueName ?? "",
		home: buildTeamVM("LOCAL", data.homeTeam.name, data.homePlayers, blanksFor(registeredHome)),
		away: buildTeamVM("VISITANTE", data.awayTeam.name, data.awayPlayers, blanksFor(registeredAway)),
		density: resolveDensity(targetRows),
		overflowsToSecondPage: targetRows > TIGHT_MAX_ROWS,
	};
}
