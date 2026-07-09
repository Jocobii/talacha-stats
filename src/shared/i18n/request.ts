import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { messageNamespaces } from "./config";
import { routing } from "./routing";

// ── Carga y fusiona los diccionarios namespaced (plan §3, nota FSD) ─────────
// Cada archivo messages/{locale}/{namespace}.json se cuelga bajo su propia
// clave de namespace, así `getTranslations("ligas")` lee `ligas.json`.
async function loadMessages(locale: string): Promise<AbstractIntlMessages> {
	const entries = await Promise.all(
		messageNamespaces.map(async (namespace) => {
			const messages = (await import(`./messages/${locale}/${namespace}.json`)).default;
			return [namespace, messages] as const;
		}),
	);
	return Object.fromEntries(entries) as AbstractIntlMessages;
}

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

	return {
		locale,
		messages: await loadMessages(locale),
	};
});
