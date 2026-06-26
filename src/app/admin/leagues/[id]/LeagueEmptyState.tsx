import Link from "next/link";

/**
 * Se muestra cuando la liga no tiene standings, goleadores ni partidos.
 * Lleva a un único camino: el wizard de configuración (equipos → jugadores).
 */
export default function LeagueEmptyState({ leagueId }: { leagueId: string }) {
	return (
		<div className="py-12 px-6">
			<div className="text-center mb-8">
				<div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 text-2xl">
					⚽
				</div>
				<h3 className="text-lg font-bold text-ink">Tu liga aún no tiene datos</h3>
				<p className="text-sm text-ink-2 mt-1 max-w-sm mx-auto">
					Termina de configurarla: agrega tus equipos y registra a los jugadores con su CURP.
				</p>
			</div>

			<div className="flex justify-center">
				<Link
					href={`/admin/leagues/${leagueId}/setup`}
					className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition"
				>
					Configurar mi liga →
				</Link>
			</div>
		</div>
	);
}
