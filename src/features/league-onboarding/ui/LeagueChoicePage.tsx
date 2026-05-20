"use client";

/**
 * features/league-onboarding/ui/LeagueChoicePage.tsx
 * Pantalla de elección de camino: registro profesional vs. importar Excel.
 */

import Link from "next/link";
import { ShieldCheck, Sparkles, FileSpreadsheet, ArrowRight, Check } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { PlayerPreviewCard } from "./PlayerPreviewCard";
import type { League } from "../types";

type Props = {
	league: League;
	onPro: () => void;
	onExcel: () => void;
};

export function LeagueChoicePage({ league, onPro, onExcel }: Props) {
	return (
		<div className="flex flex-col gap-10 max-w-[920px] mx-auto">
			<PageHeader
				breadcrumb={[
					{ label: "Ligas", href: "/admin/leagues" },
					{ label: league.name },
					{ label: "Empezar" },
				]}
				title="¿Cómo quieres empezar?"
				subtitle={`Configura ${league.name} en uno de dos caminos. El registro profesional toma más tiempo pero te da más control y mejor presentación.`}
			/>

			{/* ── PRIMARY: Registro profesional ── */}
			<section className="relative">
				<span className="absolute -top-3 left-6 z-10 inline-flex items-center gap-1.5 h-6 px-2.5 rounded text-[10.5px] font-bold tracking-[0.16em] uppercase bg-brand text-pitch">
					<Sparkles size={11} strokeWidth={2.5} /> Recomendado
				</span>

				<div className="bg-surface border border-line rounded-xl overflow-hidden relative">
					<div
						className="absolute inset-0 -z-10 pointer-events-none opacity-[0.06]"
						style={{
							background: "radial-gradient(800px 200px at 80% 0%, #00E676 0%, transparent 60%)",
						}}
					/>
					<div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
						{/* Left — sell copy */}
						<div className="p-7 sm:p-9">
							<div className="flex items-center gap-2 mb-4">
								<span className="w-9 h-9 rounded-md bg-brand/15 text-brand grid place-items-center shrink-0">
									<ShieldCheck size={18} strokeWidth={1.75} />
								</span>
								<SectionLabel>Registro profesional</SectionLabel>
							</div>
							<h2 className="font-display text-[36px] sm:text-[44px] leading-[0.95] font-black tracking-tight text-ink">
								Cada jugador
								<br />
								con identidad real.
							</h2>
							<p className="mt-4 text-[15px] leading-relaxed text-ink-2 max-w-[460px]">
								Registra equipos y jugadores con CURP. Cada jugador se queda con su historial entre
								temporadas y obtiene una página pública con sus estadísticas — listo para presumir
								en redes.
							</p>
							<ul className="mt-6 flex flex-col gap-3">
								<Bullet>Crea equipos en menos de 30 segundos</Bullet>
								<Bullet>Ventanilla de registro con búsqueda nacional por CURP</Bullet>
								<Bullet>Perfil público compartible para cada jugador</Bullet>
								<Bullet>Estadísticas, rachas y logros automáticos</Bullet>
							</ul>
							<div className="mt-8 flex items-center gap-3 flex-wrap">
								<Button variant="primary" size="lg" iconRight={ArrowRight} onClick={onPro}>
									Empezar registro profesional
								</Button>
								<span className="text-[12px] text-ink-3">~10 min · 3 pasos</span>
							</div>
						</div>

						{/* Right — preview card */}
						<div className="hidden lg:flex items-start border-l border-line bg-pitch/40 p-6">
							<div className="w-full">
								<SectionLabel className="mb-3 !text-ink-3">Vista previa</SectionLabel>
								<PlayerPreviewCard />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── SECONDARY: Excel ── */}
			<section>
				<SectionLabel className="mb-3">Camino rápido</SectionLabel>
				<button
					onClick={onExcel}
					className="w-full text-left bg-surface/60 border border-line rounded-lg p-5 sm:p-6 hover:border-ink-3 transition group flex items-start gap-5"
				>
					<span className="w-10 h-10 shrink-0 rounded-md bg-surface-2 border border-line grid place-items-center text-ink-2 group-hover:text-ink transition">
						<FileSpreadsheet size={18} strokeWidth={1.75} />
					</span>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="text-[15px] font-semibold text-ink">Importar desde Excel</h3>
							<Badge tone="neutral">Limitado</Badge>
						</div>
						<p className="text-[13px] text-ink-2 mt-1.5 max-w-[560px]">
							Si ya tienes los datos en una hoja, súbela y generamos tabla de posiciones + goleo. No
							crea identidades de jugador ni historial entre temporadas.
						</p>
					</div>
					<span className="text-[13px] font-medium text-ink-3 group-hover:text-ink transition shrink-0 inline-flex items-center gap-1.5 pt-0.5">
						Subir Excel <ArrowRight size={14} strokeWidth={2} />
					</span>
				</button>
			</section>

			{/* Escape hatch */}
			<div className="text-center -mt-4">
				<Link
					href={`/admin/leagues/${league.id}`}
					className="text-[12px] text-ink-3 hover:text-ink-2 transition"
				>
					Hacer esto después — ir a la liga →
				</Link>
			</div>
		</div>
	);
}

function Bullet({ children }: { children: React.ReactNode }) {
	return (
		<li className="flex items-start gap-2.5 text-[14px] text-ink leading-snug">
			<span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-brand/15 grid place-items-center">
				<Check size={11} strokeWidth={3} className="text-brand" />
			</span>
			{children}
		</li>
	);
}
