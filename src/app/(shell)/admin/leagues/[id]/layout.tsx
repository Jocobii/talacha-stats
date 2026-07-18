/**
 * app/admin/leagues/[id]/layout.tsx
 *
 * Shell unificado de la vista de liga — pantalla de referencia canónica de
 * `PageShell` (docs/FRONTEND-UI-REFACTOR-PLAN.md Fase 4).
 * Renderiza: breadcrumb, cabecera (nombre + metadatos + acciones) y tab bar.
 * El {children} corresponde al contenido del tab activo.
 */

import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { LeagueTabBar, PageHeader, PageShell } from "@/shared/ui";

type Props = {
	children: ReactNode;
	params: Promise<{ id: string }>;
};

export default async function LeagueLayout({ children, params }: Props) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: {
			id: true,
			name: true,
			dayOfWeek: true,
			season: true,
			slug: true,
			schedulingEnabled: true,
			organizationId: true,
		},
		with: {
			organization: {
				columns: { id: true, name: true, slug: true },
			},
		},
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	return (
		<PageShell
			header={
				<PageHeader
					breadcrumb={[{ label: "Dashboard", href: "/admin" }]}
					title={league.name}
					subtitle={
						<span className="capitalize">
							{league.dayOfWeek} — {league.season}
						</span>
					}
					meta={
						league.organization && (
							<span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2">
								{league.organization.name}
							</span>
						)
					}
				/>
			}
			toolbar={<LeagueTabBar leagueId={id} schedulingEnabled={league.schedulingEnabled} />}
		>
			{children}
		</PageShell>
	);
}
