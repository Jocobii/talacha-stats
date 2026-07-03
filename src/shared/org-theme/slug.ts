/**
 * shared/org-theme/slug.ts
 *
 * Validación de slugs de organización (docs/ORG-THEMING.md §2).
 * DNS-safe desde hoy: cada slug será mañana un subdominio
 * (`novofut.talachastats.com`), así que un slug inválido como subdominio
 * es deuda técnica — se bloquea en el onboarding, no en la migración a
 * subdominios.
 *
 * PURO y client-safe (el form lo usa para feedback inmediato; el server
 * revalida — la validación de cliente es UX, no seguridad).
 */

/** 3-40 chars, minúsculas/dígitos/guiones, sin guion inicial/final. */
export const ORG_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** Reservados para infraestructura y rutas propias — nunca asignables a una org. */
export const RESERVED_ORG_SLUGS: ReadonlySet<string> = new Set([
	// infraestructura / DNS
	"www",
	"api",
	"app",
	"admin",
	"mail",
	"smtp",
	"ftp",
	"cdn",
	"assets",
	"static",
	"staging",
	"dev",
	"test",
	"demo",
	"status",
	// rutas públicas actuales o probables de la plataforma
	"ranking",
	"ligas",
	"liga",
	"org",
	"player",
	"players",
	"matchday",
	"login",
	"register",
	"onboarding",
	"ayuda",
	"soporte",
	"blog",
	"docs",
	// marca
	"talachastats",
	"talacha",
]);

export type OrgSlugValidation =
	| { ok: true }
	| { ok: false; reason: "formato" | "reservado"; message: string };

export function validateOrgSlug(slug: string): OrgSlugValidation {
	if (!ORG_SLUG_REGEX.test(slug) || slug.includes("--")) {
		return {
			ok: false,
			reason: "formato",
			message:
				"El slug debe tener 3-40 caracteres: minúsculas, números y guiones (sin guiones al inicio/final ni dobles).",
		};
	}
	if (RESERVED_ORG_SLUGS.has(slug)) {
		return {
			ok: false,
			reason: "reservado",
			message: "Ese nombre está reservado por la plataforma. Elige otro.",
		};
	}
	return { ok: true };
}

/** Sugerencia de slug a partir del nombre de la org: minúsculas, sin
 *  acentos, espacios → guiones. El usuario puede editarla después. */
export function suggestOrgSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // quita diacríticos post-NFD (á→a, ñ→n)
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40)
		.replace(/-+$/, "");
}
