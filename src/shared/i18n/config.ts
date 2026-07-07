// ── Configuración central de i18n (AGENTS.md §3.5 DRY) ───────────────────────
// Única fuente de verdad para locales soportados, namespaces de mensajes y la
// estrategia de prefijo de URL. `routing.ts`, `request.ts` y `navigation.ts`
// importan de aquí — nunca hardcodear estos valores en otro lugar.
// Ver docs/I18N-PLAN.md §1.

/** Locales soportados. `es` es y sigue siendo el default (plan §0). */
export const locales = ["es", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "es";

/**
 * `as-needed`: el default (`es`) no lleva prefijo (`/ligas`), el resto sí
 * (`/en/ligas`). Preserva las URLs indexadas de hoy — ver plan §1 y §5.
 */
export const localePrefix = "as-needed" as const;

/**
 * Sin detección automática por cookie/`Accept-Language`. El plan (§0, §12) es
 * explícito: "no hay demanda anglo comprobada todavía" y "el usuario elige" —
 * un visitante con el navegador/SO en inglés NO debe ser redirigido de "/" a
 * "/en" solo por eso. El locale se decide únicamente por el prefijo de la URL
 * (o por el LocaleSwitcher, que sí puede fijar el cookie explícitamente).
 */
export const localeDetection = false;

/**
 * Namespaces de mensajes = dominios de UI pública (plan §3, nota FSD).
 * Cada entrada corresponde a `messages/{locale}/{namespace}.json`.
 */
export const messageNamespaces = [
	"common",
	"home",
	"ligas",
	"ranking",
	"player",
	"matchday",
	"org",
] as const;

export type MessageNamespace = (typeof messageNamespaces)[number];

export function isAppLocale(value: string): value is AppLocale {
	return (locales as readonly string[]).includes(value);
}
