import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales, localePrefix } from "./config";

// ── Routing compartido entre el middleware y las APIs de navegación ─────────
// Ver docs/I18N-PLAN.md §1 y §5. No duplicar `locales`/`defaultLocale` en
// ningún otro archivo — todo sale de `config.ts`.
export const routing = defineRouting({
	locales,
	defaultLocale,
	localePrefix,
});
