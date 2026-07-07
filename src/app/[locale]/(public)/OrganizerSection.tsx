"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Globe, BarChart3, Share2, ChevronRight, CheckCircle } from "lucide-react";

const VALUE_PROPS = [
	{
		Icon: Globe,
		title: "Tu liga, visible para todos",
		desc: "Página pública con el nombre de tu liga, tabla de posiciones y goleadores. Un link que puedes compartir con tus jugadores hoy mismo.",
		delay: 80,
	},
	{
		Icon: BarChart3,
		title: "Tus jugadores en el ranking de la ciudad",
		desc: "Los goleadores de tu liga aparecen automáticamente en el ranking cruzado de Tijuana. Tu liga pone gente en el mapa.",
		delay: 180,
	},
	{
		Icon: Share2,
		title: "Contenido listo para compartir",
		desc: "Cada temporada genera una tarjeta con las stats de tu liga. La compartes en tu grupo de WhatsApp o en tus redes. Sin diseño, sin esfuerzo.",
		delay: 280,
	},
];

const PERKS = [
	"Sin cuotas por jugador",
	"Captura la jornada desde tu celular con la cédula digital",
	"Sorteo, calendario y liguilla incluidos",
	"Tus datos, tus ligas, tu crédito",
];

function ValueCard({
	Icon,
	title,
	desc,
	delay,
	visible,
}: {
	Icon: typeof Globe;
	title: string;
	desc: string;
	delay: number;
	visible: boolean;
}) {
	return (
		<div
			className="flex gap-4"
			style={{
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(20px)",
				transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
			}}
		>
			<div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5">
				<Icon size={18} strokeWidth={2} className="text-brand-ink" />
			</div>
			<div>
				<p className="font-semibold text-ink text-sm mb-1">{title}</p>
				<p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
			</div>
		</div>
	);
}

export default function OrganizerSection() {
	const [visible, setVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					obs.disconnect();
				}
			},
			{ threshold: 0.1 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	return (
		<section className="bg-surface border-t border-line px-5 py-16" id="organizadores">
			<div className="max-w-4xl mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
					{/* ── Columna izquierda: copy ── */}
					<div ref={ref}>
						{/* Eyebrow */}
						<p
							className="text-[11px] font-bold text-brand-ink uppercase tracking-widest mb-3"
							style={{
								opacity: visible ? 1 : 0,
								transition: "opacity 0.4s ease",
							}}
						>
							Para organizadores
						</p>

						{/* Headline */}
						<h2
							className="font-display font-black text-4xl sm:text-5xl uppercase leading-[0.9] tracking-tight text-ink mb-4"
							style={{
								opacity: visible ? 1 : 0,
								transform: visible ? "translateY(0)" : "translateY(16px)",
								transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
							}}
						>
							Tu liga
							<br />
							<span className="text-brand-ink">merece</span>
							<br />
							ser vista.
						</h2>

						{/* Subtexto */}
						<p
							className="text-ink-2 text-base leading-relaxed mb-8 max-w-sm"
							style={{
								opacity: visible ? 1 : 0,
								transition: "opacity 0.5s ease 0.2s",
							}}
						>
							Tú pones el trabajo. TalachaStats pone la plataforma. Captura tu jornada en la cédula
							digital y tu liga tiene presencia pública al instante.
						</p>

						{/* Perks */}
						<ul
							className="space-y-2 mb-8"
							style={{
								opacity: visible ? 1 : 0,
								transition: "opacity 0.5s ease 0.3s",
							}}
						>
							{PERKS.map((perk) => (
								<li key={perk} className="flex items-center gap-2.5 text-sm text-ink-2">
									<CheckCircle size={14} strokeWidth={2} className="text-brand-ink shrink-0" />
									{perk}
								</li>
							))}
						</ul>

						{/* CTA */}
						<div
							className="flex items-center gap-4 flex-wrap"
							style={{
								opacity: visible ? 1 : 0,
								transform: visible ? "translateY(0)" : "translateY(10px)",
								transition: "opacity 0.5s ease 0.4s, transform 0.5s ease 0.4s",
							}}
						>
							<Link
								href="/register"
								className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-6 py-3.5 rounded-xl text-sm transition font-body"
							>
								Registra tu liga gratis
								<ChevronRight size={16} strokeWidth={2} />
							</Link>
							<Link
								href="/login"
								className="text-sm text-ink-3 hover:text-ink transition-colors font-medium"
							>
								Ya tengo cuenta →
							</Link>
						</div>
					</div>

					{/* ── Columna derecha: value props ── */}
					<div className="flex flex-col gap-7">
						{VALUE_PROPS.map((vp) => (
							<ValueCard key={vp.title} {...vp} visible={visible} />
						))}

						{/* Puerta a la vista completa del organizador */}
						<Link
							href="/?vista=organizador"
							className="inline-flex items-center gap-1.5 text-sm text-brand-ink hover:underline font-semibold mt-2"
							style={{
								opacity: visible ? 1 : 0,
								transition: `opacity 0.6s ease 400ms`,
							}}
						>
							Ver todo lo que incluye
							<ChevronRight size={14} strokeWidth={2} />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
