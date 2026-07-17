import Link from "next/link";

/**
 * Se muestra cuando la liga no tiene standings, goleadores ni partidos.
 * El módulo de liga ya no ofrece el wizard de equipos/jugadores (decisión
 * Jocobi, jul 2026) — esa responsabilidad vive en el módulo de Equipos, que
 * pregunta a qué liga pertenece al crear cada equipo. Aquí solo se explica y
 * se enlaza hacia allá, sin stepper propio.
 */
export default function LeagueEmptyState() {
	return (
		<div className="py-12 px-6">
			<div className="text-center mb-8">
				<div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 text-2xl">
					⚽
				</div>
				<h3 className="text-lg font-bold text-ink">Tu liga aún no tiene datos</h3>
				<p className="text-sm text-ink-2 mt-1 max-w-sm mx-auto">
					Aún no tiene equipos ni partidos. Crea tus equipos desde el módulo de Equipos, eligiendo
					esta liga, y los jugadores se registran ahí mismo con su CURP.
				</p>
			</div>

			<div className="flex justify-center">
				<Link
					href="/admin/teams"
					className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition"
				>
					Ir a Equipos →
				</Link>
			</div>
		</div>
	);
}
