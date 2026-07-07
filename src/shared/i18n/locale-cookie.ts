import { defaultLocale, isAppLocale, type AppLocale } from "./config";

// ── Helper puro para la preferencia de idioma (plan §3, §9.2) ────────────────
// `next-intl` ya setea el cookie `NEXT_LOCALE` vía middleware (routing.ts).
// Este módulo es la única fuente de verdad para su nombre y para validar un
// valor crudo (ej. leído en un Client Component) contra los locales soportados.

/** Nombre del cookie que usa el middleware de next-intl para recordar el locale. */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * Valida un valor crudo de cookie contra los locales soportados.
 * Degrada a `defaultLocale` ante valores ausentes, vacíos o desconocidos —
 * nunca lanza, nunca deja pasar un locale inválido.
 */
export function parseLocaleCookie(rawValue: string | undefined | null): AppLocale {
	if (!rawValue) return defaultLocale;
	return isAppLocale(rawValue) ? rawValue : defaultLocale;
}
