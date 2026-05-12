import Link from "next/link";
import { TemplateLinks } from "@/shared/ui/TemplateLinks";

/**
 * Se muestra cuando la liga no tiene standings, goleadores ni partidos.
 * Le dice al organizador cuál es el siguiente paso: importar su Excel.
 */
export default function LeagueEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
			<div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-5">
				<span className="text-3xl">📊</span>
			</div>

			<h3 className="text-lg font-bold text-ink mb-2">Tu liga está lista. Ahora súbele vida.</h3>

			<p className="text-sm text-ink-2 max-w-sm mb-6">
				Importa el Excel de tu temporada y tu tabla de posiciones, top goleadores y perfiles de
				jugadores se generan solos.
			</p>

			<Link
				href="/admin/imports"
				className="bg-brand text-pitch px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dim transition"
			>
				Importar estadísticas →
			</Link>

			<div className="mt-6">
				<TemplateLinks />
			</div>
		</div>
	);
}
