import Link from "next/link";
import { TemplateLinks } from "@/shared/ui/TemplateLinks";

/**
 * Se muestra cuando la liga no tiene standings, goleadores ni partidos.
 * Ofrece dos caminos: importar Excel o flujo profesional V2.
 */
export default function LeagueEmptyState({ leagueId }: { leagueId: string }) {
	return (
		<div className="py-12 px-6">
			{/* Header */}
			<div className="text-center mb-8">
				<div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 text-2xl">
					⚽
				</div>
				<h3 className="text-lg font-bold text-ink">Tu liga está lista. ¿Cómo quieres empezar?</h3>
				<p className="text-sm text-ink-2 mt-1 max-w-sm mx-auto">
					Elige el flujo que mejor se adapte a tu organización.
				</p>
			</div>

			{/* Dos caminos */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
				{/* Camino A: Excel */}
				<Link
					href={`/admin/imports?leagueId=${leagueId}`}
					className="group flex flex-col p-5 rounded-2xl border border-line bg-surface hover:border-brand/40 hover:bg-brand/5 transition-all"
				>
					<span className="text-2xl mb-3">📊</span>
					<p className="text-sm font-bold text-ink mb-1">Importar Excel</p>
					<p className="text-xs text-ink-2 leading-relaxed flex-1">
						Tengo datos históricos en una hoja de cálculo. Los importo y el sistema genera
						posiciones y goleadores automáticamente.
					</p>
					<p className="text-xs text-brand font-semibold mt-3 group-hover:underline">
						Ir al importador →
					</p>
				</Link>

				{/* Camino B: Flujo profesional V2 */}
				<Link
					href={`/admin/leagues/${leagueId}/setup?start=v2`}
					className="group flex flex-col p-5 rounded-2xl border border-line bg-surface hover:border-brand/40 hover:bg-brand/5 transition-all"
				>
					<span className="text-2xl mb-3">🏟️</span>
					<p className="text-sm font-bold text-ink mb-1">Registro profesional (Recomendado)</p>
					<p className="text-xs text-ink-2 leading-relaxed flex-1">
						Empiezo desde cero. Registro jugadores con CURP, creo equipos y los inscribo a la liga
						paso a paso.
					</p>
					<p className="text-xs text-brand font-semibold mt-3 group-hover:underline">
						Ver guía de inicio →
					</p>
				</Link>
			</div>

			{/* Plantillas Excel */}
			<div className="mt-8 text-center">
				<TemplateLinks />
			</div>
		</div>
	);
}
