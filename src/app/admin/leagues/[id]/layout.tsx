/**
 * app/admin/leagues/[id]/layout.tsx
 *
 * Shell unificado de la vista de liga.
 * Renderiza: breadcrumb, cabecera (nombre + metadatos + acciones) y tab bar.
 * El {children} corresponde al contenido del tab activo.
 */

import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { LeagueTabBar } from "@/shared/ui";

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
		<div>
			{/* ── Cabecera ──────────────────────────────────────────────────────── */}
			<div className="mb-0">
				<Link href="/admin" className="text-sm text-ink-2 hover:underline">
					← Dashboard
				</Link>

				<div className="flex items-start justify-between gap-4 mt-1">
					<div>
						<h1 className="text-2xl font-bold text-ink">{league.name}</h1>
						<p className="text-ink-2 capitalize text-sm">
							{league.dayOfWeek} — {league.season}
							{league.organization && (
								<span className="ml-2 text-xs bg-surface-2 text-ink-2 px-2 py-0.5 rounded-full">
									{league.organization.name}
								</span>
							)}
						</p>
					</div>
				</div>
			</div>

			{/* ── Tab bar ───────────────────────────────────────────────────────── */}
			<LeagueTabBar leagueId={id} schedulingEnabled={league.schedulingEnabled} />

			{/* ── Contenido del tab activo ──────────────────────────────────────── */}
			<div className="mt-4">{children}</div>
		</div>
	);
}
