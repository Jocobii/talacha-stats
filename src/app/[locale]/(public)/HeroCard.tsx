"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Star, MapPin, BarChart3 } from "lucide-react";

/* ── Counter hook ────────────────────────────────────────────────
   Cuenta de 0 al target con easing easeOutExpo.
   Arranca después de `delay` ms.
──────────────────────────────────────────────────────────────── */
function useCounter(target: number, duration = 1200, delay = 0) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		const timeout = setTimeout(() => {
			const start = performance.now();
			const tick = (now: number) => {
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
				setValue(Math.round(eased * target));
				if (progress < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		}, delay);

		return () => clearTimeout(timeout);
	}, [target, duration, delay]);

	return value;
}

/* ── HeroCard ────────────────────────────────────────────────────
   Tarjeta de jugador ficticia que se construye sola al cargar.
   Cada sección entra con animationDelay escalonado.
──────────────────────────────────────────────────────────────── */
export default function HeroCard() {
	const goals = useCounter(47, 1200, 600);
	const games = useCounter(89, 1200, 900);
	const leagues = useCounter(3, 500, 1200);

	const badges = [
		{
			label: "Artillero",
			Icon: Flame,
			color: "text-orange-400",
			bg: "bg-orange-400/10 border-orange-400/20",
			delay: "1.6s",
		},
		{
			label: "Racha 5+",
			Icon: Star,
			color: "text-yellow-400",
			bg: "bg-yellow-400/10 border-yellow-400/20",
			delay: "1.75s",
		},
		{
			label: "Top Ciudad",
			Icon: Trophy,
			color: "text-brand-ink",
			bg: "bg-brand/10 border-brand/20",
			delay: "1.9s",
		},
	];

	return (
		/* Tarjeta flotante */
		<div
			className="animate-fade-slide-up animate-card-float w-full max-w-xs mx-auto"
			style={{ animationDelay: "0.1s", animationFillMode: "both" }}
		>
			<div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
				{/* ── Header verde ── */}
				<div
					className="animate-fade-slide-up bg-brand/5 border-b border-line px-5 py-4 flex items-center gap-3"
					style={{ animationDelay: "0.25s", animationFillMode: "both" }}
				>
					{/* Avatar */}
					<div className="w-11 h-11 rounded-full bg-brand/20 border-2 border-brand/40 flex items-center justify-center shrink-0">
						<span className="font-display font-black text-base text-brand-ink">CM</span>
					</div>

					<div className="min-w-0">
						<p className="font-display font-black text-lg text-ink uppercase leading-tight tracking-tight">
							Carlos <span className="text-brand-ink">&apos;Tanque&apos;</span> M.
						</p>
						<div className="flex items-center gap-1 mt-0.5">
							<MapPin size={12} strokeWidth={2} className="text-ink-3 shrink-0" />
							<p className="text-xs text-ink-3 truncate">Tijuana · 3 ligas</p>
						</div>
					</div>
				</div>

				{/* ── Stats ── */}
				<div
					className="animate-fade-slide-up grid grid-cols-3 divide-x divide-line border-b border-line"
					style={{ animationDelay: "0.5s", animationFillMode: "both" }}
				>
					{[
						{
							label: "Goles",
							value: goals,
							icon: <Flame size={12} strokeWidth={2} className="text-brand-ink" />,
						},
						{
							label: "Partidos",
							value: games,
							icon: <BarChart3 size={12} strokeWidth={2} className="text-ink-3" />,
						},
						{
							label: "Ligas",
							value: leagues,
							icon: <Star size={12} strokeWidth={2} className="text-ink-3" />,
						},
					].map(({ label, value, icon }) => (
						<div key={label} className="flex flex-col items-center py-4 px-2 gap-1">
							<div className="flex items-center gap-1">{icon}</div>
							<span className="font-display font-black text-3xl text-ink leading-none">
								{value}
							</span>
							<span className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest">
								{label}
							</span>
						</div>
					))}
				</div>

				{/* ── Badges ── */}
				<div
					className="animate-fade-slide-up px-4 py-4 border-b border-line"
					style={{ animationDelay: "1.45s", animationFillMode: "both" }}
				>
					<p className="text-[10px] font-bold text-ink-3 uppercase tracking-widest mb-2.5">
						Logros
					</p>
					<div className="flex gap-2 flex-wrap">
						{badges.map(({ label, Icon, color, bg, delay }) => (
							<span
								key={label}
								className={`animate-pop-in inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${color} ${bg}`}
								style={{ animationDelay: delay, animationFillMode: "both" }}
							>
								<Icon size={12} strokeWidth={2} />
								{label}
							</span>
						))}
					</div>
				</div>

				{/* ── Ranking ciudad ── */}
				<div
					className="animate-fade-slide-up animate-glow-pulse px-5 py-4 flex items-center justify-between"
					style={{ animationDelay: "2.1s", animationFillMode: "both" }}
				>
					<div className="flex items-center gap-2">
						<Trophy size={16} strokeWidth={2} className="text-brand-ink" />
						<span className="text-sm font-semibold text-ink-2">Ranking Tijuana</span>
					</div>
					<span className="font-display font-black text-2xl text-brand-ink leading-none">#8</span>
				</div>
			</div>

			{/* Link bajo la tarjeta */}
			<p
				className="animate-fade-slide-up text-center text-xs text-ink-3 mt-3"
				style={{ animationDelay: "2.4s", animationFillMode: "both" }}
			>
				Tu perfil, así de claro.
			</p>
		</div>
	);
}
