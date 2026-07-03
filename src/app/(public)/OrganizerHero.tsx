import Link from "next/link";
import {
	CalendarDays,
	ClipboardList,
	Trophy,
	GitBranch,
	Globe,
	Users,
	ChevronRight,
} from "lucide-react";

/* Solo features vivas en el producto (AGENTS §1.6) — nada de importación de Excel. */
const FEATURE_LIST = [
	{ Icon: CalendarDays, label: "Sorteo y calendario automáticos" },
	{
		Icon: ClipboardList,
		label: "Cédula digital de partido: goles, tarjetas y MVP desde tu celular",
	},
	{ Icon: Trophy, label: "Tabla de posiciones y goleo que se actualizan solos" },
	{ Icon: GitBranch, label: "Liguilla con bracket de eliminación directa" },
	{ Icon: Globe, label: "Página pública de tu liga, con tus colores" },
	{ Icon: Users, label: "Tus jugadores en el ranking de la ciudad" },
];

export default function OrganizerHero() {
	return (
		<section className="relative bg-pitch overflow-hidden px-5 py-16 sm:py-24">
			<div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
				{/* ── Columna izquierda: copy ── */}
				<div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
					<span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest">
						Para organizadores · Gratis
					</span>

					{/* IKEA effect: honra el trabajo que ya hace, no lo descalifica */}
					<h1
						className="font-display font-black uppercase leading-[0.9] tracking-tight"
						style={{ fontSize: "clamp(2.6rem, 7vw, 4.8rem)" }}
					>
						Tu liga ya funciona.
						<br />
						<span className="text-brand-ink">Hazla ver</span> tan en serio como es.
					</h1>

					<p className="text-ink-2 text-base sm:text-lg leading-relaxed max-w-md">
						Captura la jornada en la{" "}
						<strong className="text-ink font-semibold">cédula digital</strong> y TalachaStats genera
						solo la tabla, los goleadores, el calendario y el contenido listo para tu grupo de
						WhatsApp.
					</p>

					{/* Aversión a la pérdida — corto, con cierre positivo */}
					<p className="text-sm text-ink-3 leading-relaxed max-w-md border-l-2 border-brand/40 pl-3 text-left">
						Cada jornada que no se registra, se pierde. Lo que captures desde hoy queda para
						siempre.
					</p>

					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
						<Link
							href="/register"
							className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-7 py-3.5 rounded-xl text-sm transition font-body"
						>
							Registra tu liga gratis
							<ChevronRight size={16} strokeWidth={2} />
						</Link>
						<Link
							href="/demo"
							className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-line border border-line text-ink font-bold px-7 py-3.5 rounded-xl text-sm transition"
						>
							Ver una liga de ejemplo
						</Link>
					</div>

					{/* Anclaje de precio */}
					<p className="text-xs text-ink-3">
						Otros sistemas cobran por equipo o por jugador. Aquí:{" "}
						<strong className="text-brand-ink">$0</strong>, sin tarjeta y sin límite de equipos.
					</p>
				</div>

				{/* ── Columna derecha: lo que tu liga obtiene ── */}
				<div className="w-full lg:w-auto lg:flex-shrink-0" style={{ maxWidth: "400px" }}>
					<div className="bg-surface border border-line rounded-2xl p-5 sm:p-6">
						<p className="text-[11px] font-bold text-brand-ink uppercase tracking-widest mb-4">
							Lo que tu liga obtiene
						</p>
						<ul className="space-y-3.5">
							{FEATURE_LIST.map(({ Icon, label }) => (
								<li key={label} className="flex items-start gap-3 text-sm text-ink-2">
									<span className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
										<Icon size={15} strokeWidth={2} className="text-brand-ink" />
									</span>
									<span className="leading-snug pt-1.5">{label}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
