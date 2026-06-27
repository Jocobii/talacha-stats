/**
 * features/league-onboarding/model/league-form-schema.ts
 *
 * FUENTE ÚNICA del contrato del alta rápida de liga. Lo consumen:
 *   - el formulario (cliente) vía zodResolver de React Hook Form
 *   - el caso de uso del server (quick-create.ts) vía safeParse
 *
 * Client-safe: NO importa de @/db (Drizzle) para no arrastrar el schema de la
 * base al bundle del navegador. Por eso los días se declaran aquí como tupla.
 */

import { z } from "zod";

/**
 * Días válidos. DEBE coincidir con DAYS_OF_WEEK de src/db/schema.ts.
 * (Se duplica a propósito para mantener este módulo client-safe.)
 */
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

/** Etiquetas cortas para el selector de día (chips). */
export const DAYS: { value: DayValue; label: string }[] = [
	{ value: "lunes", label: "Lun" },
	{ value: "martes", label: "Mar" },
	{ value: "miercoles", label: "Mié" },
	{ value: "jueves", label: "Jue" },
	{ value: "viernes", label: "Vie" },
	{ value: "sabado", label: "Sáb" },
	{ value: "domingo", label: "Dom" },
];

export const QuickCreateLeagueSchema = z.object({
	name: z.string().trim().min(2, "Escribe el nombre de la liga.").max(100),
	dayOfWeek: z.enum(DAY_VALUES),
	season: z.string().trim().min(2, "Escribe la temporada.").max(50),
	category: z.string().max(80).optional(),
	organizationId: z.string().uuid().optional(),
});

export type QuickCreateLeagueInput = z.infer<typeof QuickCreateLeagueSchema>;

/** Default inteligente: Clausura (ene–jun) / Apertura (jul–dic) del año actual. */
export function defaultSeason(): string {
	const now = new Date();
	const phase = now.getMonth() <= 5 ? "Clausura" : "Apertura";
	return `${phase} ${now.getFullYear()}`;
}
