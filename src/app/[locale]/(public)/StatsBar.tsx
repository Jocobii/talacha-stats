"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

/* ── Hook: counter que arranca cuando el elemento entra al viewport ── */
function useScrollCounter(target: number, duration = 1400, delay = 0) {
	const [count, setCount] = useState(0);
	const [started, setStarted] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	/* IntersectionObserver — dispara una sola vez */
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setStarted(true);
					obs.disconnect();
				}
			},
			{ threshold: 0.45 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	/* Conteo con easeOutExpo */
	useEffect(() => {
		if (!started) return;
		const timer = setTimeout(() => {
			const t0 = performance.now();
			const tick = (now: number) => {
				const p = Math.min((now - t0) / duration, 1);
				const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
				setCount(Math.round(e * target));
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		}, delay);
		return () => clearTimeout(timer);
	}, [started, target, duration, delay]);

	return { count, ref, started };
}

/* ── Stat individual ── */
type StatDef = {
	target: number;
	suffix?: string;
	nsKey: "goals" | "activeLeagues" | "players";
	delay: number;
};

const STATS: StatDef[] = [
	{ target: 1247, suffix: "+", nsKey: "goals", delay: 0 },
	{ target: 8, nsKey: "activeLeagues", delay: 160 },
	{ target: 312, nsKey: "players", delay: 320 },
];

function StatItem({ target, suffix = "", nsKey, delay }: StatDef) {
	const t = useTranslations("home");
	const format = useFormatter();
	const { count, ref, started } = useScrollCounter(target, 1400, delay);

	return (
		<div
			ref={ref}
			className="flex flex-col items-center gap-1.5"
			style={{
				opacity: started ? 1 : 0,
				transform: started ? "translateY(0)" : "translateY(22px)",
				transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
			}}
		>
			<span className="font-display font-black text-5xl sm:text-6xl text-ink leading-none">
				{format.number(count)}
				{suffix}
			</span>
			<span className="text-[11px] text-ink-3 uppercase tracking-widest font-semibold">
				{t(`statsBar.${nsKey}`)}
			</span>
		</div>
	);
}

/* ── Sección ── */
export default function StatsBar() {
	return (
		<section className="relative bg-surface border-t border-b border-line py-12 px-5 overflow-hidden">
			{/* Línea decorativa brand */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-brand rounded-full opacity-60" />

			<div className="max-w-2xl mx-auto grid grid-cols-3 gap-6 sm:gap-12">
				{STATS.map((s) => (
					<StatItem key={s.nsKey} {...s} />
				))}
			</div>
		</section>
	);
}
