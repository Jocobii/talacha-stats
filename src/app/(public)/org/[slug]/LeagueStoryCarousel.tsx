"use client";

import { useEffect, useState } from "react";
import type { Story } from "@/features/org-hub";

const INTERVAL_MS = 4_000;

type Props = { stories: Story[] };

/**
 * Carrusel rotante — Idea A.
 * Muestra una historia a la vez y avanza automáticamente cada 4 s.
 * Los puntos de navegación permiten saltar manualmente.
 * La lógica de qué historias mostrar vive en features/org-hub/stories.ts,
 * este componente solo se encarga de la rotación.
 */
export default function LeagueStoryCarousel({ stories }: Props) {
	const [current, setCurrent] = useState(0);
	const [fading, setFading] = useState(false);

	useEffect(() => {
		if (stories.length <= 1) return;

		const timer = setInterval(() => {
			setFading(true);
			const next = setTimeout(() => {
				setCurrent((prev) => (prev + 1) % stories.length);
				setFading(false);
			}, 280);
			return () => clearTimeout(next);
		}, INTERVAL_MS);

		return () => clearInterval(timer);
	}, [stories.length]);

	const story = stories[current];

	return (
		<div className="bg-pitch border border-line rounded-2xl overflow-hidden">
			{/* Eyebrow + live dot */}
			<div className="flex items-center justify-between px-4 pt-3.5 pb-0">
				<div className="flex items-center gap-2">
					<span
						aria-hidden="true"
						className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shrink-0"
					/>
					<span className="text-[10px] font-bold text-ink-3 uppercase tracking-widest">
						{story.eyebrow}
					</span>
				</div>
				{story.tag && (
					<span className="text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
						{story.tag}
					</span>
				)}
			</div>

			{/* Contenido animado */}
			<div
				className="px-4 pt-3 pb-4"
				style={{
					opacity: fading ? 0 : 1,
					transform: fading ? "translateY(6px)" : "translateY(0)",
					transition: "opacity 0.28s ease, transform 0.28s ease",
				}}
			>
				<p className="text-sm text-ink-2 leading-snug mb-1">{story.headline}</p>
				<p className="font-display font-black text-4xl text-ink leading-none tracking-tight">
					{story.stat}
				</p>
				<p className="text-xs text-ink-3 mt-1">{story.context}</p>
			</div>

			{/* Barra de progreso + dots */}
			{stories.length > 1 && (
				<div className="px-4 pb-3.5 flex items-center gap-1.5">
					{stories.map((_, i) => (
						<button
							key={i}
							aria-label={`Historia ${i + 1}`}
							onClick={() => {
								setFading(false);
								setCurrent(i);
							}}
							className="h-0.5 rounded-full transition-all duration-300 cursor-pointer"
							style={{
								width: i === current ? "20px" : "12px",
								background: i === current ? "var(--color-brand)" : "rgba(255,255,255,0.15)",
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}
