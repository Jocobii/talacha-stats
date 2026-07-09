/**
 * demo/mock.ts
 *
 * Datos ficticios + tipos + helpers compartidos por los tabs del demo.
 * Todo es estático (sin fetch): el demo muestra "cómo se ve tu liga".
 */

// ─── Ligas base ─────────────────────────────────────────────────────────────

export const LIGA_JUEVES = { name: "Liga Compadres", day: "Jueves", season: "2025" };
export const LIGA_LUNES = { name: "Liga Guerreros", day: "Lunes", season: "2025" };

// ─── Ranking ────────────────────────────────────────────────────────────────

export const RANKING = [
	{
		id: "1",
		fullName: "Roberto Mendoza",
		alias: "El Toro",
		team: "Deportivo Azteca",
		league: LIGA_JUEVES,
		goals: 18,
		matches: 12,
		leagues: 2,
	},
	{
		id: "2",
		fullName: "Carlos Vega",
		alias: "Pichichi",
		team: "Los Guerreros",
		league: LIGA_JUEVES,
		goals: 15,
		matches: 11,
		leagues: 1,
	},
	{
		id: "3",
		fullName: "Jesús Rodríguez",
		alias: "La Máquina",
		team: "Real Colonia",
		league: LIGA_LUNES,
		goals: 13,
		matches: 10,
		leagues: 2,
	},
	{
		id: "4",
		fullName: "Marco Jiménez",
		alias: "El Rayo",
		team: "América TJ",
		league: LIGA_JUEVES,
		goals: 11,
		matches: 10,
		leagues: 1,
	},
	{
		id: "5",
		fullName: "Armando García",
		alias: null,
		team: "Tigres Norte",
		league: LIGA_LUNES,
		goals: 11,
		matches: 12,
		leagues: 1,
	},
	{
		id: "6",
		fullName: "Daniel López",
		alias: "Tecate",
		team: "Deportivo Azteca",
		league: LIGA_JUEVES,
		goals: 10,
		matches: 11,
		leagues: 1,
	},
	{
		id: "7",
		fullName: "Fernando Ruiz",
		alias: null,
		team: "Los Galácticos",
		league: LIGA_LUNES,
		goals: 9,
		matches: 10,
		leagues: 1,
	},
	{
		id: "8",
		fullName: "Miguel Torres",
		alias: "Mago",
		team: "Real Colonia",
		league: LIGA_LUNES,
		goals: 8,
		matches: 11,
		leagues: 2,
	},
];

// ─── Perfil ─────────────────────────────────────────────────────────────────

export const DEMO_PLAYER = {
	fullName: "Roberto Mendoza",
	alias: "El Toro",
	global: { goals: 23, matches: 19, leagues: 2, gpm: 1.21 },
	leagues: [
		{
			name: "Liga Compadres",
			day: "Jueves",
			season: "2025",
			team: "Deportivo Azteca",
			goals: 18,
			matches: 12,
			gpm: 1.5,
			yellows: 3,
			reds: 0,
			teamGoals: 38,
		},
		{
			name: "Liga Veteranos",
			day: "Sábado",
			season: "2025",
			team: "Azteca Masters",
			goals: 5,
			matches: 7,
			gpm: 0.71,
			yellows: 1,
			reds: 0,
			teamGoals: 23,
		},
	],
};

// ─── Jornada ────────────────────────────────────────────────────────────────

export const MATCHDAY = [
	{
		league: LIGA_JUEVES,
		jornada: 12,
		heroes: [
			{
				id: "1",
				fullName: "Roberto Mendoza",
				alias: "El Toro",
				team: "Deportivo Azteca",
				goals: 3,
				matches: 1,
				gpm: 3.0,
			},
			{
				id: "2",
				fullName: "Carlos Vega",
				alias: "Pichichi",
				team: "Los Guerreros",
				goals: 2,
				matches: 1,
				gpm: 2.0,
			},
			{
				id: "4",
				fullName: "Marco Jiménez",
				alias: "El Rayo",
				team: "América TJ",
				goals: 2,
				matches: 1,
				gpm: 2.0,
			},
		],
	},
	{
		league: LIGA_LUNES,
		jornada: 11,
		heroes: [
			{
				id: "3",
				fullName: "Jesús Rodríguez",
				alias: "La Máquina",
				team: "Real Colonia",
				goals: 4,
				matches: 1,
				gpm: 4.0,
			},
			{
				id: "8",
				fullName: "Miguel Torres",
				alias: "Mago",
				team: "Real Colonia",
				goals: 2,
				matches: 1,
				gpm: 2.0,
			},
			{
				id: "7",
				fullName: "Fernando Ruiz",
				alias: null,
				team: "Los Galácticos",
				goals: 1,
				matches: 1,
				gpm: 1.0,
			},
		],
	},
];

// ─── Análisis ───────────────────────────────────────────────────────────────

export const ANALYSIS = {
	league: { name: "Liga Compadres", season: "2025", jornada: 12 },
	teamA: {
		name: "Deportivo Azteca",
		color: "blue" as const,
		position: 1,
		points: 26,
		record: { w: 8, d: 2, l: 2 },
		gf: 28,
		gc: 12,
		diff: 16,
		avg: 2.33,
		last5: ["W", "W", "W", "D", "W"] as const,
		streak: { type: "W" as const, count: 3 },
		attackRank: 1,
		defenseRank: 1,
		totalTeams: 8,
		topScorer: { name: "El Toro", goals: 18 },
		cardRisk: [{ player: "Daniel López", note: "4 amarillas" }],
		threats: [
			{ name: "El Toro", goals: 18, gpm: 1.5, danger: "ALTO" },
			{ name: "Tecate", goals: 10, gpm: 0.91, danger: "MEDIO" },
			{ name: "Erick Soto", goals: 5, gpm: 0.5, danger: "BAJO" },
		],
		roster: [
			{ name: "El Toro", goals: 18, yellows: 3, reds: 0, pj: 12, danger: "ALTO" },
			{ name: "Tecate", goals: 10, yellows: 2, reds: 0, pj: 11, danger: "MEDIO" },
			{ name: "Erick Soto", goals: 5, yellows: 1, reds: 0, pj: 10, danger: "BAJO" },
			{ name: "Andrés Mora", goals: 3, yellows: 0, reds: 0, pj: 10, danger: "BAJO" },
			{ name: "Omar Vidal", goals: 2, yellows: 4, reds: 1, pj: 9, danger: "BAJO" },
		],
	},
	teamB: {
		name: "Los Guerreros",
		color: "blue" as const,
		position: 2,
		points: 21,
		record: { w: 6, d: 3, l: 3 },
		gf: 20,
		gc: 16,
		diff: 4,
		avg: 1.67,
		last5: ["W", "W", "W", "D", "W"] as const,
		streak: { type: "W" as const, count: 1 },
		attackRank: 3,
		defenseRank: 4,
		totalTeams: 8,
		topScorer: { name: "Pichichi", goals: 15 },
		cardRisk: [{ player: "Hugo Ramos", note: "acumula 4" }],
		threats: [
			{ name: "Pichichi", goals: 15, gpm: 1.36, danger: "ALTO" },
			{ name: "Hugo Ramos", goals: 4, gpm: 0.4, danger: "BAJO" },
			{ name: "Iván Flores", goals: 1, gpm: 0.1, danger: "BAJO" },
		],
		roster: [
			{ name: "Pichichi", goals: 15, yellows: 1, reds: 0, pj: 11, danger: "ALTO" },
			{ name: "Hugo Ramos", goals: 4, yellows: 4, reds: 0, pj: 10, danger: "BAJO" },
			{ name: "Iván Flores", goals: 1, yellows: 0, reds: 0, pj: 8, danger: "BAJO" },
			{ name: "Saúl Pérez", goals: 0, yellows: 2, reds: 0, pj: 11, danger: "BAJO" },
		],
	},
	prob: { a: 58, draw: 18, b: 24 },
	h2h: { aWins: 4, draws: 1, bWins: 2, total: 7, last: { a: 3, b: 1 } },
	prediction: {
		scoreA: 3,
		scoreB: 1,
		expA: 2.8,
		expB: 1.5,
		total: 4.3,
		label: "abierto" as const,
		bothScore: true,
		offEdge: "A" as const,
		defEdge: "A" as const,
	},
	simulator: {
		a: { pos: 1, pts: 26, win: 1, draw: 1, loss: 1 },
		b: { pos: 2, pts: 21, win: 2, draw: 2, loss: 4 },
	},
	bullets: [
		"Deportivo Azteca llega como líder con 3 victorias al hilo — el equipo más en forma de la liga.",
		"El Toro Mendoza es la principal amenaza: 18 goles en 12 partidos, el mejor ratio de la temporada.",
		"Los Guerreros dependen casi exclusivamente de Pichichi Vega para marcar — si lo neutralizan, el partido cambia.",
		"Azteca tiene la mejor defensa de la liga, apenas 12 goles recibidos. Los Guerreros van a sufrir.",
		"Cuidado con Hugo Ramos: lleva 4 amarillas y está al borde de la suspensión.",
	],
	funFacts: [
		"El Toro ha marcado en los últimos 7 partidos consecutivos.",
		"Azteca no ha perdido cuando anota primero (8 de 8).",
		"Los Guerreros ganaron el único partido donde Pichichi hizo doblete esta temporada.",
	],
};

export type TeamData = typeof ANALYSIS.teamA;

// ─── Coordinador: canchas ───────────────────────────────────────────────────

export const VENUES = [
	{
		id: "v1",
		name: "Cancha La Bombonera",
		address: "Col. Libertad, Tijuana",
		color: "#00e676",
		ligasCount: 2,
		windows: 14,
		ligas: ["Liga Compadres", "Liga Guerreros"],
	},
	{
		id: "v2",
		name: "Deportivo El Florido",
		address: "El Florido, Tijuana",
		color: "#60a5fa",
		ligasCount: 1,
		windows: 8,
		ligas: ["Liga Veteranos"],
	},
	{
		id: "v3",
		name: "Unidad Deportiva Reforma",
		address: "Zona Centro, Tijuana",
		color: "#f87171",
		ligasCount: 1,
		windows: 10,
		ligas: ["Liga Lunes"],
	},
	{
		id: "v4",
		name: "Sintética 5 de Mayo",
		address: "Otay, Tijuana",
		color: "#fbbf24",
		ligasCount: 0,
		windows: 6,
		ligas: [] as string[],
	},
];

// ─── Coordinador: sorteo ────────────────────────────────────────────────────

export const SORTEO = {
	jornada: 12,
	noRepeat: 3,
	fixedSlots: 2,
	venuesCount: 2,
	pairings: [
		{
			home: "Deportivo Azteca",
			away: "Los Guerreros",
			venue: "La Bombonera",
			time: "19:00",
			fixed: false,
		},
		{ home: "Real Colonia", away: "América TJ", venue: "La Bombonera", time: "20:00", fixed: true },
		{
			home: "Tigres Norte",
			away: "Los Galácticos",
			venue: "La Bombonera",
			time: "21:00",
			fixed: false,
		},
		{
			home: "Azteca Masters",
			away: "Deportivo Sur",
			venue: "El Florido",
			time: "19:00",
			fixed: true,
		},
		{ home: "Real Otay", away: "Barcelona TJ", venue: "El Florido", time: "20:00", fixed: false },
		{ home: "Halcones", away: "Juventus Mx", venue: "El Florido", time: "21:00", fixed: false },
	],
};

// ─── Coordinador: apartado ──────────────────────────────────────────────────

export const APARTADO = {
	venue: "Cancha La Bombonera",
	price: 350,
	times: ["19:00", "20:00", "21:00", "22:00"],
	days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
	// team ocupa [dayIdx][timeIdx]; "" = libre
	grid: [
		["", "Real Colonia", "", "Halcones"],
		["", "", "Tigres", ""],
		["Barcelona TJ", "", "", ""],
		["Deportivo Azteca", "América TJ", "Los Guerreros", ""],
		["", "Juventus Mx", "", "Deportivo Sur"],
		["Azteca Masters", "", "Real Otay", ""],
	] as string[][],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function initial(name: string, alias: string | null) {
	return (alias ?? name).charAt(0).toUpperCase();
}
