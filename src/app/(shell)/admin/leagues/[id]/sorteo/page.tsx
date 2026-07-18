/**
 * app/admin/leagues/[id]/sorteo/page.tsx
 *
 * Tab "Sorteo" — cockpit de sorteo de jornada.
 * La cabecera y el tab bar viven en el layout padre (leagues/[id]/layout.tsx).
 *
 * Altura: el CockpitPage necesita llenar el viewport. Dado que ahora vive dentro
 * del layout con tab bar, usamos min-height calculado en lugar de height:100%
 * para evitar colapso cuando el contenedor padre no tiene altura explícita.
 *
 * Si la fase final ya arrancó (existe playoff_bracket para la liga), este tab
 * no tiene nada que ofrecer — el bracket vive en el tab Calendario. En vez de
 * cargar el cockpit y mostrar un panel "ya arrancó, ve al otro tab" cada vez
 * que el organizador entra aquí, se redirige directo a Calendario en el
 * servidor (sin flash de UI intermedio).
 */
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Settings } from "lucide-react";
import { getSessionUser } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, playoffBrackets } from "@/db/schema";
import { CockpitPage } from "@/features/sorteo-cockpit";

export const metadata = { title: "Sorteo · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function SorteoPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const bracket = await db.query.playoffBrackets.findFirst({
		where: eq(playoffBrackets.leagueId, id),
		columns: { id: true },
	});
	if (bracket) redirect(`/admin/leagues/${id}/calendario`);

	// Scheduling desactivado → estado inline en el tab (sin redirect)
	if (!league.schedulingEnabled) {
		return (
			<div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
				<div className="w-12 h-12 rounded-full bg-surface-2 border border-line grid place-items-center">
					<Settings size={20} className="text-ink-3" strokeWidth={1.5} />
				</div>
				<div>
					<p className="text-ink font-semibold">El módulo de sorteo no está activo</p>
					<p className="text-sm text-ink-2 mt-1 max-w-xs">
						Actívalo en Configuración para empezar a sortear jornadas automáticamente.
					</p>
				</div>
				<Link
					href={`/admin/leagues/${id}/configuracion`}
					className="text-sm text-brand-ink hover:underline font-medium"
				>
					Ir a Configuración →
				</Link>
			</div>
		);
	}

	return (
		/*
		 * min-height calculado: llena el viewport descontando la cabecera del AdminShell
		 * (py-8 = 32px × 2) + cabecera de liga (~88px) + tab bar (~48px) + mt-6 (24px).
		 * El CockpitPage maneja su propio overflow interno por paneles.
		 */
		<div
			style={{
				minHeight: "calc(100vh - 260px)",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<CockpitPage leagueId={id} leagueName={league.name} />
		</div>
	);
}
