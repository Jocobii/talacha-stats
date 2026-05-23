import Link from "next/link";
import type { Metadata } from "next";
import {
	BarChart3,
	Trophy,
	Users,
	Zap,
	MapPin,
	ChevronRight,
	Mail,
	ExternalLink,
} from "lucide-react";
// Trophy y Users se usan en las secciones de features y nav interno

export const metadata: Metadata = {
	title: "¿Qué es TalachaStats? — Conoce la plataforma",
	description:
		"TalachaStats es la primera plataforma de estadísticas cross-liga para fútbol amateur en Tijuana. Tu perfil, tu historial, tu ranking en toda la ciudad.",
};

/* ── Social icon components (Instagram + Facebook) ─────────────── */
function IconInstagram({ size = 18 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
			<circle cx="12" cy="12" r="4" />
			<circle cx="17.5" cy="6.5" r="0" fill="currentColor" stroke="none" />
			<circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
		</svg>
	);
}

function IconFacebook({ size = 18 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
		</svg>
	);
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function AboutPage() {
	return (
		<div className="text-ink flex flex-col">
			{/* ── HERO ──────────────────────────────────────────────────── */}
			<section className="px-5 py-20 flex flex-col items-center text-center border-b border-line">
				<span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest mb-8">
					<MapPin size={12} strokeWidth={2} /> Tijuana · Fútbol Amateur
				</span>

				<h1 className="font-display font-black text-5xl sm:text-7xl uppercase leading-[0.9] tracking-tight max-w-2xl">
					Por primera vez,
					<br />
					Tijuana sabrá quién es
					<br />
					<span className="text-brand-ink">el mejor.</span>
				</h1>

				<p className="text-ink-2 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mt-7">
					TalachaStats es la primera plataforma de estadísticas para fútbol amateur que conecta{" "}
					<strong className="text-ink">todas las ligas de la ciudad</strong> en un solo perfil por
					jugador.
				</p>
			</section>

			{/* ── EL PROBLEMA ───────────────────────────────────────────── */}
			<section className="px-5 py-16 max-w-3xl mx-auto w-full">
				<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
					El problema
				</p>
				<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-6">
					Llevas años jugando.
					<br />
					<span className="text-ink-2">Nadie lleva la cuenta.</span>
				</h2>
				<p className="text-ink-2 leading-relaxed text-sm sm:text-base max-w-xl">
					En el fútbol amateur cada liga vive en su propia burbuja. Los goles que metiste el lunes
					no cuentan en la liga del martes. No hay un historial, no hay un perfil, no hay forma de
					saber quién es realmente el mejor jugador de la ciudad. Eso hasta ahora.
				</p>
			</section>

			{/* ── QUÉ ES ────────────────────────────────────────────────── */}
			<section className="bg-surface border-y border-line px-5 py-16">
				<div className="max-w-3xl mx-auto">
					<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
						Qué es TalachaStats
					</p>
					<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-10">
						Un perfil. Todas tus ligas.
					</h2>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
						{[
							{
								Icon: Users,
								title: "Perfil de jugador",
								desc: "Cada jugador tiene su propia página con goles, partidos, rachas y badges ganados a lo largo de su carrera amateur.",
							},
							{
								Icon: BarChart3,
								title: "Historial cross-liga",
								desc: "No importa en cuántas ligas juegas — todo suma al mismo perfil. Tu carrera completa en un solo lugar.",
							},
							{
								Icon: Trophy,
								title: "Ranking de la ciudad",
								desc: "Un ranking unificado que cruza todas las ligas registradas. Por primera vez, Tijuana tiene un top de jugadores amateurs.",
							},
						].map(({ Icon, title, desc }) => (
							<div key={title} className="flex flex-col gap-3">
								<div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center shrink-0">
									<Icon size={20} className="text-brand-ink" strokeWidth={2} />
								</div>
								<p className="font-bold text-ink text-sm">{title}</p>
								<p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── CÓMO FUNCIONA ─────────────────────────────────────────── */}
			<section className="px-5 py-16 max-w-3xl mx-auto w-full">
				<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
					Cómo funciona
				</p>
				<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-10">
					Simple para el organizador.
					<br />
					<span className="text-brand-ink">Poderoso para el jugador.</span>
				</h2>

				<div className="flex flex-col gap-0">
					{[
						{
							step: "01",
							title: "El organizador sube su Excel",
							desc: "Una vez por semana, el organizador de la liga sube los resultados en el mismo formato que ya usa. Sin cambiar su flujo de trabajo.",
						},
						{
							step: "02",
							title: "TalachaStats procesa todo",
							desc: "La plataforma identifica a cada jugador, acumula sus estadísticas y actualiza el ranking de la ciudad automáticamente.",
						},
						{
							step: "03",
							title: "El jugador comparte su perfil",
							desc: "Cada jugador recibe su link personal. Lo manda por WhatsApp, lo pone en su bio, lo presume cuando alguien le pregunte si juega bien.",
						},
					].map(({ step, title, desc }, i, arr) => (
						<div key={step} className="flex gap-5">
							<div className="flex flex-col items-center">
								<div className="w-10 h-10 rounded-full bg-surface-2 border border-line flex items-center justify-center shrink-0">
									<span className="font-display font-black text-xs text-brand-ink">{step}</span>
								</div>
								{i < arr.length - 1 && <div className="w-px flex-1 bg-line my-2" />}
							</div>
							<div className={`pb-10 ${i === arr.length - 1 ? "pb-0" : ""}`}>
								<p className="font-bold text-ink text-sm mb-1.5">{title}</p>
								<p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* ── VISIÓN ────────────────────────────────────────────────── */}
			<section className="bg-surface border-y border-line px-5 py-16">
				<div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-10 items-start">
					<div className="flex-1">
						<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
							Nuestra visión
						</p>
						<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-5">
							Tijuana primero.
							<br />
							<span className="text-brand-ink">Después el mundo.</span>
						</h2>
						<p className="text-ink-2 text-sm leading-relaxed max-w-md">
							Empezamos en Tijuana porque es nuestra ciudad y porque tiene una escena de fútbol
							amateur vibrante que merece ser documentada. El objetivo es que cada liga que se sume
							haga el ranking más completo y más competitivo — hasta que no haya duda de quién es el
							mejor jugador amateur de la ciudad.
						</p>
						<p className="text-ink-2 text-sm leading-relaxed max-w-md mt-4">
							Después de Tijuana, cualquier ciudad. El modelo es el mismo: un Excel semanal, un
							perfil por jugador, un ranking que lo dice todo.
						</p>
					</div>

					<div className="flex flex-col gap-4 shrink-0">
						{[
							{ value: "∞", label: "Goles por registrar" },
							{ value: "1", label: "Perfil por jugador" },
							{ value: "🏙️", label: "Ciudad conectada" },
						].map(({ value, label }) => (
							<div
								key={label}
								className="bg-surface-2 border border-line rounded-xl px-6 py-4 text-center min-w-[140px]"
							>
								<p className="font-display font-black text-3xl text-brand-ink">{value}</p>
								<p className="text-ink-3 text-xs font-semibold uppercase tracking-wide mt-1">
									{label}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── CTA ORGANIZADORES ─────────────────────────────────────── */}
			<section className="px-5 py-16 max-w-3xl mx-auto w-full">
				<div className="bg-surface-2 border border-brand/20 rounded-2xl px-7 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-3">
							<Zap size={16} className="text-brand-ink" strokeWidth={2} />
							<p className="text-xs font-bold text-brand-ink uppercase tracking-widest">
								Para organizadores
							</p>
						</div>
						<h3 className="font-display font-black text-2xl sm:text-3xl uppercase leading-tight mb-3">
							Tus jugadores merecen esto.
						</h3>
						<p className="text-ink-2 text-sm leading-relaxed max-w-sm">
							Activa TalachaStats en tu liga. Sin cambiar tu flujo de trabajo — solo súbenos tu
							Excel de cada semana y nosotros hacemos el resto. Es gratis mientras estamos en demo.
						</p>
					</div>
					<div className="flex flex-col gap-3 shrink-0">
						<a
							href="mailto:talachastats@gmail.com"
							className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-6 py-3.5 rounded-xl text-sm transition"
						>
							<Mail size={16} strokeWidth={2} />
							Quiero activarla
						</a>
						<Link
							href="/demo"
							className="flex items-center justify-center gap-2 bg-surface border border-line text-ink-2 hover:text-ink font-semibold px-6 py-3.5 rounded-xl text-sm transition"
						>
							<ChevronRight size={16} strokeWidth={2} />
							Ver demo primero
						</Link>
					</div>
				</div>
			</section>

			{/* ── REDES SOCIALES ────────────────────────────────────────── */}
			<section className="bg-surface border-t border-line px-5 py-12">
				<div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
					<div>
						<p className="font-display font-black text-lg uppercase tracking-tight text-ink mb-1">
							Síguenos en redes
						</p>
						<p className="text-ink-3 text-xs">Contenido, stats destacadas y novedades de la app.</p>
					</div>
					<div className="flex gap-3">
						<a
							href="https://www.instagram.com/talachastats/"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2.5 bg-surface-2 hover:bg-line border border-line text-ink-2 hover:text-ink font-semibold px-5 py-3 rounded-xl text-sm transition"
						>
							<IconInstagram size={16} />
							Instagram
							<ExternalLink size={12} className="text-ink-3" />
						</a>
						<a
							href="https://www.facebook.com/talachastats"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2.5 bg-surface-2 hover:bg-line border border-line text-ink-2 hover:text-ink font-semibold px-5 py-3 rounded-xl text-sm transition"
						>
							<IconFacebook size={16} />
							Facebook
							<ExternalLink size={12} className="text-ink-3" />
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}
