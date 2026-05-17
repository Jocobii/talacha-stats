/**
 * app/admin/leagues/[id]/sorteo/page.tsx
 *
 * Server Component — Hub del módulo de sorteo para una liga.
 * Muestra el estado del módulo y enlaces a sub-secciones.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CalendarDays, MapPin, Settings, Shuffle, ToggleLeft, ToggleRight } from "lucide-react";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { SchedulingToggle } from "./SchedulingToggle";

export const metadata = { title: "Sorteo · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function SorteoHubPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: {
			id: true,
			name: true,
			season: true,
			organizationId: true,
			schedulingEnabled: true,
		},
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const isEnabled = league.schedulingEnabled;

	const sections = [
		{
			href: `/admin/leagues/${id}/sorteo/canchas`,
			icon: MapPin,
			title: "Canchas",
			description: "Registra las canchas y sus ventanas horarias disponibles",
			available: true,
		},
		{
			href: `/admin/leagues/${id}/sorteo/configuracion`,
			icon: Settings,
			title: "Configuración",
			description: "Duración de partidos, buffer, descansos y horarios comprados",
			available: isEnabled,
		},
		{
			href: `/admin/leagues/${id}/sorteo/sortear`,
			icon: Shuffle,
			title: "Hacer sorteo",
			description: "Preview del calendario y confirmación del sorteo",
			available: isEnabled,
		},
		{
			href: `/admin/leagues/${id}/sorteo/calendario`,
			icon: CalendarDays,
			title: "Calendario",
			description: "Vista por jornada del calendario confirmado",
			available: isEnabled,
		},
	];

	return (
		<div>
			<div className="mb-6">
				<Link href={`/admin/leagues/${id}`} className="text-sm text-ink-2 hover:underline">
					← {league.name}
				</Link>
				<div className="flex items-start justify-between gap-4 mt-1">
					<div>
						<h1 className="text-2xl font-bold text-ink">Módulo de sorteo</h1>
						<p className="text-ink-2 text-sm">
							{league.name} — {league.season}
						</p>
					</div>
					{user.role === "owner" && <SchedulingToggle leagueId={id} initialEnabled={isEnabled} />}
				</div>
			</div>

			{!isEnabled && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3 items-start">
					<ToggleLeft className="text-amber-500 shrink-0 mt-0.5" size={18} />
					<div>
						<p className="text-sm font-medium text-amber-800">Módulo desactivado</p>
						<p className="text-xs text-amber-700 mt-0.5">
							Activa el módulo de sorteo para habilitar la configuración y generación de
							calendarios. Solo los owners pueden activarlo.
						</p>
					</div>
				</div>
			)}

			{isEnabled && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-3 items-start">
					<ToggleRight className="text-green-600 shrink-0 mt-0.5" size={18} />
					<p className="text-sm text-green-800">
						Módulo activo — el organizador puede configurar canchas, horarios y generar el
						calendario.
					</p>
				</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{sections.map((s) => {
					const Icon = s.icon;
					const inner = (
						<div
							className={`bg-surface rounded-lg shadow p-5 flex gap-4 items-start transition-colors ${
								s.available ? "hover:bg-surface-2 cursor-pointer" : "opacity-50 cursor-not-allowed"
							}`}
						>
							<div className="bg-brand/10 rounded-lg p-2 shrink-0">
								<Icon className="text-brand" size={20} />
							</div>
							<div>
								<p className="font-semibold text-ink">{s.title}</p>
								<p className="text-sm text-ink-2 mt-0.5">{s.description}</p>
								{!s.available && (
									<p className="text-xs text-amber-600 mt-1">Requiere módulo activo</p>
								)}
							</div>
						</div>
					);

					return s.available ? (
						<Link key={s.href} href={s.href}>
							{inner}
						</Link>
					) : (
						<div key={s.href}>{inner}</div>
					);
				})}
			</div>
		</div>
	);
}
