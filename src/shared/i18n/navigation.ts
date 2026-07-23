import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// ── Navegación locale-aware (plan §6.3) ──────────────────────────────────────
// Prohibido usar `next/link` crudo o `next/navigation` en rutas públicas —
// estos wrappers respetan el prefijo de locale (`as-needed`) automáticamente.
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
	createNavigation(routing);
