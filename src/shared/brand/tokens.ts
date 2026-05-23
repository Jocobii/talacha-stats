/**
 * shared/brand/tokens.ts
 * Strings canónicos de marca TalachaStats.
 * FUENTE ÚNICA — no hardcodear en routes de imagen ni en componentes.
 */
export const BRAND = {
	wordmark: "TALACHASTATS",
	tagline: "Tu liga, en serio.",
	domain: "talachastats.com",
	/** CTA principal para visitantes que llegan por asset compartido */
	ctaAdopt: "¿Organizas otra liga? Pide la tuya gratis.",
	/** CTA compacto en el sello de imagen */
	ctaScan: "Escanea para ver la liga",
	/** Texto de ciudad — actualizar cuando la app sea multi-ciudad */
	city: "FÚTBOL AMATEUR · TIJUANA",
} as const;
