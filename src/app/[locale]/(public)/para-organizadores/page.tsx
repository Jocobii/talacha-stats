import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Sistema de gestión de ligas de fútbol gratis | Para organizadores",
	description:
		"Administra tu liga de fútbol amateur gratis. Tabla de posiciones automática, sorteo de jornadas, estadísticas de goleadores y página pública para tus jugadores. Sin costo, sin tarjeta.",
	alternates: {
		canonical: "/para-organizadores",
	},
	openGraph: {
		title: "Sistema de gestión de ligas de fútbol gratis — TalachaStats",
		description:
			"Administra tu liga de fútbol amateur sin costo. Tabla de posiciones, sorteo y estadísticas en minutos.",
	},
};

const features = [
	{
		title: "Tabla de posiciones automática",
		description:
			"Captura la jornada en la cédula digital y la tabla se actualiza sola. Sin fórmulas, sin errores.",
	},
	{
		title: "Cédula digital de partido",
		description:
			"Goles, tarjetas y MVP capturados desde tu celular en la cancha. El marcador se resuelve al cerrar la cédula.",
	},
	{
		title: "Goleadores y estadísticas",
		description:
			"Cada jugador tiene su historial de goles por jornada. Los mejores aparecen en el ranking de la ciudad.",
	},
	{
		title: "Sorteo de jornadas",
		description:
			"Genera el fixture de forma aleatoria respetando las canchas, los equipos presentes y el historial de enfrentamientos.",
	},
	{
		title: "Página pública de tu liga",
		description:
			"Un link que puedes compartir con tus jugadores. Ven su posición, sus goles y el calendario. Sin descargar nada.",
	},
	{
		title: "Perfil por jugador",
		description:
			"Cada jugador tiene un perfil con sus estadísticas en todas las ligas en las que ha participado.",
	},
	{
		title: "Liguilla con bracket",
		description:
			"Genera el bracket de eliminación directa con seeding automático. Los ganadores avanzan solos.",
	},
];

const faqs = [
	{
		q: "¿Necesito tarjeta de crédito para empezar?",
		a: "No. El registro es completamente gratuito y no pedimos datos de pago.",
	},
	{
		q: "¿Cuánto tiempo tarda en configurarse?",
		a: "Menos de 10 minutos. Registras tu liga, cargas tus equipos y capturas tu primera jornada con la cédula digital.",
	},
	{
		q: "¿Funciona para ligas pequeñas de colonia?",
		a: "Sí. La mayoría de ligas en la plataforma tienen entre 6 y 16 equipos. No hay mínimo.",
	},
	{
		q: "¿Puedo tener varias ligas con la misma cuenta?",
		a: "Sí. Puedes administrar múltiples ligas (lunes, miércoles, sábado) desde el mismo panel.",
	},
	{
		q: "¿Mis jugadores necesitan registrarse?",
		a: "No. Los jugadores ven sus estadísticas públicamente sin crear cuenta. Solo el organizador necesita una.",
	},
];

export default function ParaOrganizadoresPage() {
	return (
		<main>
			{/* Hero */}
			<section className="px-6 py-16 sm:py-24 max-w-3xl mx-auto text-center">
				<p className="text-brand-ink text-sm font-semibold uppercase tracking-widest mb-4">
					Para organizadores
				</p>
				<h1 className="font-display font-extrabold text-4xl sm:text-5xl text-ink leading-tight mb-6">
					Sistema gratuito de gestión de ligas de fútbol
				</h1>
				<p className="text-ink-2 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
					Administra tu liga amateur sin hojas de cálculo manuales ni grupos de WhatsApp caóticos.
					Tabla de posiciones, goleadores y sorteo de jornadas, todo en un solo lugar. Gratis.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Link href="/register" className="btn-primary text-base px-8 py-3 rounded-xl font-bold">
						Registra tu liga gratis →
					</Link>
					<Link href="/ligas" className="btn-ghost text-base px-8 py-3 rounded-xl">
						Ver ligas en la plataforma
					</Link>
				</div>
				<p className="text-ink-3 text-sm mt-4">
					Sin tarjeta de crédito · Sin cuotas por jugador · Listo en 10 minutos
				</p>
			</section>

			{/* Features */}
			<section className="px-6 py-12 max-w-4xl mx-auto">
				<h2 className="font-display font-extrabold text-2xl text-ink text-center mb-10">
					Todo lo que necesitas para administrar tu liga
				</h2>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((f) => (
						<div key={f.title} className="bg-surface-2 rounded-xl p-5 border border-line">
							<h3 className="font-display font-bold text-ink text-base mb-2">{f.title}</h3>
							<p className="text-ink-2 text-sm leading-relaxed">{f.description}</p>
						</div>
					))}
				</div>
			</section>

			{/* El costo de no hacerlo (aversión a la pérdida, cierre positivo) */}
			<section className="px-6 py-12 max-w-2xl mx-auto text-center">
				<div className="bg-surface-2 rounded-2xl p-8 border border-line">
					<p className="text-ink text-lg leading-relaxed mb-2">
						Cada jornada que no se registra, se pierde. Los goles de tus jugadores, el campeón de la
						temporada pasada — si no están registrados, no existen.
					</p>
					<p className="text-brand-ink text-sm font-semibold">
						Todo lo que captures desde hoy queda para siempre.
					</p>
				</div>
			</section>

			{/* FAQ */}
			<section className="px-6 py-12 max-w-2xl mx-auto">
				<h2 className="font-display font-extrabold text-2xl text-ink text-center mb-8">
					Preguntas frecuentes
				</h2>
				<div className="space-y-5">
					{faqs.map((faq) => (
						<div key={faq.q} className="border-b border-line pb-5">
							<h3 className="font-semibold text-ink mb-1">{faq.q}</h3>
							<p className="text-ink-2 text-sm leading-relaxed">{faq.a}</p>
						</div>
					))}
				</div>
			</section>

			{/* CTA final */}
			<section className="px-6 py-16 text-center">
				<h2 className="font-display font-extrabold text-3xl text-ink mb-4">Empieza hoy, gratis.</h2>
				<p className="text-ink-2 mb-6">Tu liga tiene presencia pública en menos de 10 minutos.</p>
				<Link href="/register" className="btn-primary text-base px-10 py-3 rounded-xl font-bold">
					Registra tu liga →
				</Link>
			</section>
		</main>
	);
}
