import { z } from "zod";
import { EVENT_TYPES, MATCH_STATUSES, DAYS_OF_WEEK } from "@/db/schema";

// ---------------------------------------------------------------------------
// Schemas de validación Zod
// ---------------------------------------------------------------------------

export const CreatePlayerSchema = z.object({
	fullName: z.string().min(2).max(100),
	alias: z.string().max(50).optional(),
	phone: z.string().max(20).optional(),
	photoUrl: z.string().url().optional(),
});

export const UpdatePlayerSchema = CreatePlayerSchema.partial();

export const CreateLeagueSchema = z.object({
	name: z.string().min(2).max(100),
	slug: z
		.string()
		.min(2)
		.max(80)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
		.optional(),
	category: z.string().max(80).optional(),
	dayOfWeek: z.enum(DAYS_OF_WEEK),
	season: z.string().min(2).max(50),
	organizationId: z.string().uuid().optional(),
});

export const UpdateLeagueSchema = CreateLeagueSchema.partial().extend({
	status: z.enum(["active", "finished"]).optional(),
});

export const CreateTeamSchema = z.object({
	name: z.string().min(1).max(100),
	leagueId: z.string().uuid(),
	color: z.string().max(30).optional(),
});

export const UpdateTeamSchema = CreateTeamSchema.partial().omit({
	leagueId: true,
});

export const RegisterPlayerSchema = z.object({
	playerId: z.string().uuid(),
	teamId: z.string().uuid(),
	leagueId: z.string().uuid(),
	jerseyNumber: z.number().int().min(1).max(99).optional(),
});

export const CreateMatchSchema = z.object({
	leagueId: z.string().uuid(),
	homeTeamId: z.string().uuid(),
	awayTeamId: z.string().uuid(),
	matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	matchday: z.number().int().min(1).optional(),
	notes: z.string().max(500).optional(),
});

export const UpdateMatchSchema = z.object({
	homeScore: z.number().int().min(0).optional(),
	awayScore: z.number().int().min(0).optional(),
	status: z.enum(MATCH_STATUSES).optional(),
	matchDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	matchday: z.number().int().min(1).optional(),
	notes: z.string().max(500).optional(),
});

export const CreateMatchEventSchema = z.object({
	playerId: z.string().uuid(),
	teamId: z.string().uuid(),
	eventType: z.enum(EVENT_TYPES),
	minute: z.number().int().min(1).max(120).optional(),
});

// ---------------------------------------------------------------------------
// Tipos de respuesta para las APIs
// ---------------------------------------------------------------------------

export type PlayerStats = {
	playerId: string;
	fullName: string;
	alias: string | null;
	leagueId: string;
	leagueName: string;
	season: string;
	teamId: string;
	teamName: string;
	matchesPlayed: number;
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
	ownGoals: number;
	mvpCount: number;
};

export type PlayerGlobalStats = {
	playerId: string;
	fullName: string;
	alias: string | null;
	totalMatches: number;
	totalGoals: number;
	totalAssists: number;
	totalYellowCards: number;
	totalRedCards: number;
	totalOwnGoals: number;
	totalMvp: number;
	leaguesCount: number;
};

export type TeamStanding = {
	teamId: string;
	teamName: string;
	leagueId: string;
	leagueName: string;
	season: string;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDifference: number;
	points: number;
	zone?: string; // LIGUILLA | COPA | RECOPA — solo en imports desde Excel
};

export type DangerRating = "ALTO" | "MEDIO" | "BAJO";

export type TopThreat = {
	playerId: string;
	player: string;
	alias: string | null;
	goalsThisSeason: number;
	goalsLast3Matches: number;
	assists: number;
	goalsPerMatch: number;
	dangerRating: DangerRating;
};

export type CardRiskPlayer = {
	playerId: string;
	player: string;
	yellowCards: number;
	redCards: number;
	note: string;
};

export type HeadToHead = {
	totalMatches: number;
	homeWins: number;
	draws: number;
	awayWins: number;
	lastMatch: { date: string; result: string } | null;
};

export type MatchPreview = {
	match: {
		id: string;
		homeTeam: string;
		awayTeam: string;
		league: string;
		matchday: number | null;
		date: string;
	};
	teamForm: {
		home: TeamFormStats;
		away: TeamFormStats;
	};
	winProbability: {
		homeWinPct: number;
		drawPct: number;
		awayWinPct: number;
		method: string;
	};
	topThreats: {
		home: TopThreat[];
		away: TopThreat[];
	};
	cardRisk: {
		home: CardRiskPlayer[];
		away: CardRiskPlayer[];
	};
	headToHead: HeadToHead;
	narratorBullets: string[];
};

export type TeamFormStats = {
	record: { wins: number; draws: number; losses: number };
	points: number;
	goalsScored: number;
	goalsConceded: number;
	avgGoalsPerMatch: number;
	last5: ("W" | "D" | "L")[];
};

// ---------------------------------------------------------------------------
// Helpers de respuesta API
// ---------------------------------------------------------------------------
export function apiSuccess<T>(data: T, status = 200) {
	return Response.json({ ok: true, data }, { status });
}

export function apiSuccessPaginated<T>(
	data: T[],
	meta: import("@/shared/lib/pagination").PaginationMeta,
	status = 200,
) {
	return Response.json({ ok: true, data, meta }, { status });
}

export function apiError(message: string, status = 400, detail?: Record<string, unknown>) {
	return Response.json({ ok: false, error: message, ...detail }, { status });
}

// ===========================================================================
// MÓDULO DE SORTEO — Schemas Zod (T1.5)
// Documentación: docs/scheduling-plan.md §7
// ===========================================================================

export const SchedulingConfigSchema = z.object({
	regularMatchdays: z.number().int().min(1).max(60),
	regularFormat: z.enum(["single", "double"]),
	matchDurationMinutes: z.number().int().min(20).max(120),
	bufferMinutes: z.number().int().min(0).max(60),
	allowDuplicateMatchups: z.boolean().default(false),
});
export type SchedulingConfigInput = z.infer<typeof SchedulingConfigSchema>;

export const VENUE_COLORS = [
	"#7C9CFF",
	"#FBBF24",
	"#F87171",
	"#34D399",
	"#A78BFA",
	"#60A5FA",
	"#F472B6",
	"#FB923C",
] as const;

export const CreateVenueSchema = z.object({
	name: z.string().min(2).max(80),
	organizationId: z.string().uuid(),
	city: z.string().max(80).optional(),
	address: z.string().max(200).optional(),
	capacity: z.number().int().min(1).max(6).default(1),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Color debe ser hex válido (#RRGGBB)")
		.default("#60A5FA"),
	notes: z.string().max(500).optional(),
});
export type CreateVenueInput = z.infer<typeof CreateVenueSchema>;

export const UpdateVenueSchema = CreateVenueSchema.partial().omit({ organizationId: true });
export type UpdateVenueInput = z.infer<typeof UpdateVenueSchema>;

const VenueWindowBaseSchema = z.object({
	venueId: z.string().uuid(),
	dayOfWeek: z.enum(DAYS_OF_WEEK),
	startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
	endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
});

export const CreateVenueWindowSchema = VenueWindowBaseSchema.refine(
	(v) => v.startTime < v.endTime,
	{ message: "startTime debe ser anterior a endTime", path: ["startTime"] },
);
export type CreateVenueWindowInput = z.infer<typeof CreateVenueWindowSchema>;

export const UpdateVenueWindowSchema = VenueWindowBaseSchema.omit({ venueId: true })
	.partial()
	.extend({ isActive: z.boolean().optional() });
export type UpdateVenueWindowInput = z.infer<typeof UpdateVenueWindowSchema>;

export const RestRequestSchema = z.object({
	teamId: z.string().uuid(),
	matchdayNumber: z.number().int().min(1),
	reason: z.string().max(500).optional(),
});
export type RestRequestInput = z.infer<typeof RestRequestSchema>;

export const CreatePurchasedTimeslotSchema = z.object({
	teamId: z.string().uuid(),
	leagueId: z.string().uuid(),
	startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
	venueId: z.string().uuid().optional(),
	activeFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido"),
	endMatchdayNumber: z.number().int().min(1).optional(),
	notes: z.string().max(500).optional(),
});
export type CreatePurchasedTimeslotInput = z.infer<typeof CreatePurchasedTimeslotSchema>;

export const UpdatePurchasedTimeslotSchema = CreatePurchasedTimeslotSchema.omit({
	teamId: true,
	leagueId: true,
}).partial();
export type UpdatePurchasedTimeslotInput = z.infer<typeof UpdatePurchasedTimeslotSchema>;

export const GenerateScheduleSchema = z.object({
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido"),
	// Fechas explícitas opcionales; si vacío se calculan por dayOfWeek desde startDate
	matchdayDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});
export type GenerateScheduleInput = z.infer<typeof GenerateScheduleSchema>;

export const ChangeKickoffSchema = z.object({
	kickoffAt: z.string().datetime({ message: "Se requiere datetime ISO 8601 con timezone" }),
	reason: z.string().max(500).optional(),
});
export type ChangeKickoffInput = z.infer<typeof ChangeKickoffSchema>;

export const ChangeVenueSchema = z.object({
	venueId: z.string().uuid(),
	kickoffAt: z.string().datetime().optional(),
	reason: z.string().max(500).optional(),
});
export type ChangeVenueInput = z.infer<typeof ChangeVenueSchema>;

export const SwapTeamSchema = z.object({
	oldTeamId: z.string().uuid(),
	newTeamId: z.string().uuid(),
	reason: z.string().max(500).optional(),
});
export type SwapTeamInput = z.infer<typeof SwapTeamSchema>;

export const MakeupBuildSchema = z.object({
	// Si vacío, genera makeups para todos los equipos con déficit
	teamIds: z.array(z.string().uuid()).optional(),
	maxFutureMatchdays: z.number().int().min(1).max(20).default(5),
});
export type MakeupBuildInput = z.infer<typeof MakeupBuildSchema>;

// ===========================================================================
// MÓDULO DE CALENDARIO DE CANCHAS — Schemas Zod (T_VC)
// ===========================================================================

export const CreateRentalSchema = z.object({
	title: z.string().min(1).max(200),
	startAt: z.string().datetime({ message: "Se requiere datetime ISO 8601 con timezone" }),
	endAt: z.string().datetime({ message: "Se requiere datetime ISO 8601 con timezone" }),
	status: z.enum(["confirmed", "tentative"]).default("confirmed"),
	price: z.number().positive().nullable().optional(),
	notes: z.string().max(1000).nullable().optional(),
});
export type CreateRentalInput = z.infer<typeof CreateRentalSchema>;

export const UpdateRentalSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	startAt: z.string().datetime().optional(),
	endAt: z.string().datetime().optional(),
	status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
	price: z.number().positive().nullable().optional(),
	notes: z.string().max(1000).nullable().optional(),
});
export type UpdateRentalInput = z.infer<typeof UpdateRentalSchema>;
