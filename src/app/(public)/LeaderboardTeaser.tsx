"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trophy, MapPin, ChevronRight } from "lucide-react";

/* ── Datos mock del mini ranking ── */
const ROWS = [
	{ rank: 1, name: "Luis", alias: "La Bala", team: "Guerreros", goals: 61 },
	{ rank: 2, name: "Marco A.", alias: null, team: "Titanes FC", goals: 54 },
	{ rank: 3, name: "Carlos M.", alias: "Tanque", team: "Los Toros", goals: 47 },
	{ rank: 4, name: "Javier R.", alias: null, team: "Halcones", goals: 43 },
	{ rank: 5, name: "Diego M.", alias: null, team: "Fenix", goals: 41 },
];

/* ── Row individual con reveal ── */
function Row({
	rank,
	name,
	alias,
	team,
	goals,
	delay,
	visible,
}: {
	rank: number;
	name: string;
	alias: string | null;
	team: string;
	goals: number;
	delay: number;
	visible: boolean;
}) {
	const isTop3 = rank <= 3;

	return (
		<div
			className="flex items-center gap-4 px-4 py-3 rounded-xl border border-line bg-surface hover:border-brand/40 transition-colors"
			style={{
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(18px)",
				transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, border-color 0.2s`,
			}}
		>
			{/* Rank */}
			<span
				className={`font-display font-black text-xl w-8 shrink-0 text-right leading-none ${
					isTop3 ? "text-brand-ink" : "text-ink-3"
				}`}
			>
				#{rank}
			</span>

			{/* Nombre */}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-ink leading-tight truncate">
					{name}
					{alias && <span className="text-brand-ink font-normal ml-1.5">&quot;{alias}&quot;</span>}
				</p>
				<p className="text-xs text-ink-3 truncate mt-0.5">{team}</p>
			</div>

			{/* Goles */}
			<div className="text-right shrink-0">
				<p
					className={`font-display font-black text-xl leading-none ${isTop3 ? "text-brand-ink" : "text-ink"}`}
				>
					{goals}
				</p>
				<p className="text-[10px] text-ink-3 uppercase tracking-widest">goles</p>
			</div>
		</div>
	);
}

/* ── Fila pulsante "¿Dónde estás tú?" ── */
function GhostRow({ delay, visible }: { delay: number; visible: boolean }) {
	return (
		<div
			className="flex items-center gap-4 px-4 py-3 rounded-xl border border-brand/25 bg-brand/5 animate-glow-pulse"
			style={{
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(18px)",
				transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
			}}
		>
			<span className="font-display font-black text-xl w-8 shrink-0 text-right leading-none text-brand-ink/50">
				?
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-brand-ink/70 leading-tight">¿Dónde estás tú?</p>
				<p className="text-xs text-brand-ink/40 mt-0.5 flex items-center gap-1">
					<MapPin size={10} strokeWidth={2} />
					Tijuana · todas las ligas
				</p>
			</div>
			<Link
				href="/ranking"
				className="text-xs text-brand-ink font-semibold flex items-center gap-0.5 hover:underline shrink-0"
			>
				Ver <ChevronRight size={12} strokeWidth={2} />
			</Link>
		</div>
	);
}

/* ── Sección completa ── */
export default function LeaderboardTeaser() {
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
			{ threshold: 0.15 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	return (
		<section className="bg-pitch border-t border-line px-5 py-16">
			<div className="max-w-lg mx-auto">
				{/* Header */}
				<div
					className="flex items-center justify-between mb-6"
					style={{
						opacity: visible ? 1 : 0,
						transform: visible ? "translateY(0)" : "translateY(16px)",
						transition: "opacity 0.5s ease, transform 0.5s ease",
					}}
				>
					<div className="flex items-center gap-2">
						<Trophy size={16} strokeWidth={2} className="text-brand-ink" />
						<h2 className="font-display font-black text-xl uppercase tracking-wide text-ink">
							Ranking Tijuana
						</h2>
					</div>
					<span className="text-xs text-ink-3 bg-surface border border-line px-2.5 py-1 rounded-full">
						Todas las ligas
					</span>
				</div>

				{/* Tabla en cascada */}
				<div ref={ref} className="flex flex-col gap-2">
					{ROWS.map((row, i) => (
						<Row key={row.rank} {...row} delay={i * 90} visible={visible} />
					))}
					<GhostRow delay={ROWS.length * 90} visible={visible} />
				</div>

				{/* CTA */}
				<div
					className="mt-6 text-center"
					style={{
						opacity: visible ? 1 : 0,
						transition: `opacity 0.5s ease ${ROWS.length * 90 + 200}ms`,
					}}
				>
					<Link
						href="/ranking"
						className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-brand-ink transition border border-line hover:border-brand/40 px-5 py-2.5 rounded-xl"
					>
						Ver ranking completo
						<ChevronRight size={14} strokeWidth={2} />
					</Link>
				</div>
			</div>
		</section>
	);
}
