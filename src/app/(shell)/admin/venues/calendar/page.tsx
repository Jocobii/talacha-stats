/**
 * app/admin/venues/calendar/page.tsx
 *
 * Server Component — Calendario visual de uso de canchas.
 * Carga las venues de la organización y delega la interactividad
 * al Client Component VenueCalendar.
 */

import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { getSessionUser } from "@/shared/lib/auth";
import { listVenuesByOrganization } from "@/entities/venue";
import { VenueCalendar } from "@/features/venue-calendar/ui/VenueCalendar";
import type { VenueSummary } from "@/features/venue-calendar";
import { redirect } from "next/navigation";

export const metadata = { title: "Calendario de canchas · TalachaStats" };

export default async function VenueCalendarPage() {
	const user = await getSessionUser();
	if (!user) redirect("/login");

	const orgVenues = user?.organizationId ? await listVenuesByOrganization(user.organizationId) : [];

	const venues: VenueSummary[] = orgVenues.map((v) => ({
		id: v.id,
		name: v.name,
		city: v.city ?? null,
	}));

	return (
		<div>
			{/* Breadcrumb */}
			<nav className="flex items-center gap-1.5 text-[12px] text-ink-2 mb-2">
				<Link href="/admin" className="hover:text-ink hover:underline transition-colors">
					Admin
				</Link>
				<ChevronRight size={12} className="text-ink-3" />
				<span className="hover:text-ink hover:underline transition-colors cursor-default">
					Canchas
				</span>
				<ChevronRight size={12} className="text-ink-3" />
				<span className="text-ink">Calendario</span>
			</nav>

			{/* Page header */}
			<div className="flex items-end justify-between gap-4 mb-6">
				<div>
					<h1 className="font-display font-semibold text-[30px] leading-tight text-ink">
						Calendario de canchas
					</h1>
					<p className="text-sm text-ink-2 mt-1">
						Renta de horarios libres y vista unificada con partidos de liga.
					</p>
				</div>
			</div>

			{venues.length === 0 ? (
				<div className="bg-surface rounded-xl border border-line p-12 text-center space-y-3">
					<MapPin size={40} className="mx-auto text-ink-3" />
					<p className="font-semibold text-ink">Sin canchas registradas</p>
					<p className="text-sm text-ink-2">
						Registra una cancha en el módulo de sorteo para verla aquí.
					</p>
					<Link
						href="/admin/leagues"
						className="inline-block text-brand-ink text-sm hover:underline mt-2"
					>
						Ir a ligas →
					</Link>
				</div>
			) : (
				<VenueCalendar venues={venues} />
			)}
		</div>
	);
}
