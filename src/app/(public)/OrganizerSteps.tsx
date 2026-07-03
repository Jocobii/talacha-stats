import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* O4 — gradiente de meta: el paso 1 se presenta casi-trivial y el progreso ya iniciado */
const STEPS = [
	{
		number: "1",
		title: "Registra tu liga",
		desc: "2 minutos. Nombre, ciudad y listo — ya diste el paso más difícil.",
	},
	{
		number: "2",
		title: "Sube tus equipos y jugadores",
		desc: "Carga bulk de equipos y registro de jugadores en ventanilla.",
	},
	{
		number: "3",
		title: "Captura tu primera jornada",
		desc: "Con la cédula digital. En ese momento tu liga ya es pública.",
	},
];

export default function OrganizerSteps() {
	return (
		<section className="bg-pitch border-t border-line px-5 py-16">
			<div className="max-w-3xl mx-auto">
				<h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-center mb-10">
					Tu liga pública <span className="text-brand-ink">en 3 pasos</span>
				</h2>

				<ol className="flex flex-col sm:flex-row gap-8 sm:gap-4">
					{STEPS.map(({ number, title, desc }, index) => (
						<li key={number} className="flex-1 flex sm:flex-col gap-4 sm:gap-3 items-start">
							<div className="flex sm:w-full items-center gap-3">
								<span className="w-10 h-10 rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center font-display font-black text-brand-ink shrink-0">
									{number}
								</span>
								{/* Conector entre pasos (solo desktop) */}
								{index < STEPS.length - 1 && (
									<span className="hidden sm:block flex-1 h-0.5 bg-line" aria-hidden="true" />
								)}
							</div>
							<div>
								<p className="font-bold text-ink text-sm mb-1">{title}</p>
								<p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
							</div>
						</li>
					))}
				</ol>

				<div className="flex justify-center mt-10">
					<Link
						href="/register"
						className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-7 py-3.5 rounded-xl text-sm transition font-body"
					>
						Empezar con el paso 1
						<ChevronRight size={16} strokeWidth={2} />
					</Link>
				</div>
			</div>
		</section>
	);
}
