/**
 * features/arranque-onboarding/model/arranque-league-schema.ts
 *
 * Espeja QuickCreateLeagueSchema de
 * features/league-onboarding/model/league-form-schema.ts para validar el
 * Paso 2 (crear liga) con RHF + zodResolver.
 *
 * No se importa el original: §3.1 prohíbe `features → features`. El server
 * (`/api/leagues/quick-create`) sigue validando con la fuente única real
 * (`QuickCreateLeagueSchema`) — esta copia solo da feedback inmediato en el
 * cliente; el server manda si hay divergencia (§7.2: "el server sigue siendo
 * la fuente de verdad").
 */

import { z } from "zod";

export const DAY_VALUES = [
	"lunes",
	"martes",
	"miercoles",
	"jueves",
	"viernes",
	"sabado",
	"domingo",
] as const;

export type DayValue = (typeof DAY_VALUES)[number];

export const DAYS: { value: DayValue; label: string }[] = [
	{ value: "lunes", label: "Lun" },
	{ value: "martes", label: "Mar" },
	{ value: "miercoles", label: "Mié" },
	{ value: "jueves", label: "Jue" },
	{ value: "viernes", label: "Vie" },
	{ value: "sabado", label: "Sáb" },
	{ value: "domingo", label: "Dom" },
];

export const ArranqueLeagueSchema = z.object({
	name: z.string().trim().min(2, "Escribe el nombre de la liga.").max(100),
	dayOfWeek: z.enum(DAY_VALUES),
	season: z.string().trim().min(2, "Escribe la temporada.").max(50),
	category: z.string().max(80).optional(),
});

export type ArranqueLeagueInput = z.infer<typeof ArranqueLeagueSchema>;

/** Default inteligente: Clausura (ene–jun) / Apertura (jul–dic) del año actual. */
export function defaultSeason(): string {
	const now = new Date();
	const phase = now.getMonth() <= 5 ? "Clausura" : "Apertura";
	return `${phase} ${now.getFullYear()}`;
}
