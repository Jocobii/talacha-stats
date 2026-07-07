"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, Star, Search } from "lucide-react";

type Feature = {
	Icon: typeof Trophy;
	title: string;
	desc: string;
	delay: number;
};

const FEATURES: Feature[] = [
	{
		Icon: Trophy,
		title: "Ranking de Tijuana",
		desc: "¿Cuántos están por encima de ti? El ranking cruza todas las ligas para darte tu posición real en la ciudad.",
		delay: 0,
	},
	{
		Icon: Star,
		title: "Tabla de honor",
		desc: "Los mejores de cada jornada, por liga. El reconocimiento que se gana con goles.",
		delay: 130,
	},
	{
		Icon: Search,
		title: "Perfil compartible",
		desc: "Tu link personal. Lo mandas por WhatsApp y quien lo abre ve tus goles en todas las ligas.",
		delay: 260,
	},
];

function FeatureCard({ Icon, title, desc, delay }: Feature) {
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
			{ threshold: 0.2 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3"
			style={{
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(28px)",
				transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
			}}
		>
			<div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center shrink-0">
				<Icon size={20} className="text-brand-ink" strokeWidth={2} />
			</div>
			<p className="font-bold text-ink text-sm">{title}</p>
			<p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
		</div>
	);
}

export default function FeaturesSection() {
	return (
		<section className="bg-surface border-t border-line px-5 py-16">
			<div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
				{FEATURES.map((f) => (
					<FeatureCard key={f.title} {...f} />
				))}
			</div>
		</section>
	);
}
