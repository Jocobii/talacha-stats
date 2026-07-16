/**
 * entities/suspension/lib/format-suspension-for-cedula.ts
 * Texto de motivo/plazo para la marca "NO JUEGA" de la cédula impresa
 * (docs/CEDULA-IMPRESA-SPEC.md §3.2, docs/PLAN-CEDULA-IMPRESA.md §4).
 * Pura, sin DB.
 *
 * Nota: el plan original decía reusar `features/discipline/lib/format-suspension`,
 * pero eso sería `entities → features`, prohibido por §3.1 de AGENTS.md. Este
 * archivo vive en `entities/suspension` con su propio formateo de fecha (no
 * importa el de `features/discipline`, aunque el resultado visual es el mismo).
 */
import type { SuspensionDto } from "../model";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fmtIsoDateShort(isoDate: string): string {
	const [year, month, day] = isoDate.split("-").map(Number);
	return `${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export type CedulaSuspensionLabel = { tag: string; why: string };

type SuspensionForCedula = Pick<
	SuspensionDto,
	"durationType" | "matchesServed" | "matchesTotal" | "endsOn"
>;

/** `NO JUEGA` + el motivo/plazo, según §3.2 de la spec de cédula. */
export function formatSuspensionForCedula(s: SuspensionForCedula): CedulaSuspensionLabel {
	switch (s.durationType) {
		case "matches":
			return { tag: "NO JUEGA", why: `${s.matchesServed}/${s.matchesTotal ?? 0} jornadas` };
		case "time":
			return { tag: "NO JUEGA", why: s.endsOn ? `hasta ${fmtIsoDateShort(s.endsOn)}` : "" };
		case "permanent":
			return { tag: "NO JUEGA", why: "PERMANENTE" };
		default:
			return { tag: "NO JUEGA", why: "" };
	}
}
