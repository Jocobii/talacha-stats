/**
 * app/admin/organizacion/layout.tsx
 *
 * Next.js NO pasa `searchParams` a los layouts (solo a pages) — un layout no
 * puede leer `?org=<slug>` server-side. Por eso la resolución de org, la
 * cabecera y el OrgTabBar viven en OrgHubShell.tsx y se invocan desde cada
 * page.tsx (ver resolve-org.ts). Este layout queda como passthrough inerte.
 */

import type { ReactNode } from "react";

export default function OrganizacionLayout({ children }: { children: ReactNode }) {
	return children;
}
