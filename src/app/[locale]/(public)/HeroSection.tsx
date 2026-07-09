"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { MapPin, Trophy, ChevronDown } from "lucide-react";
import HeroCard from "./HeroCard";
import HeroPlayerSearch from "./HeroPlayerSearch";

/* Números fantasma — stats reales que flotan en el fondo */
const GHOST = [
	{ v: "47", top: "10%", left: "4%", sz: "clamp(90px,12vw,170px)", delay: "0s", dur: "13s" },
	{ v: "89", top: "62%", left: "1%", sz: "clamp(65px,8vw,115px)", delay: "4.5s", dur: "16s" },
	{ v: "#8", top: "14%", left: "65%", sz: "clamp(110px,14vw,200px)", delay: "2s", dur: "11s" },
	{ v: "3", top: "70%", left: "77%", sz: "clamp(75px,10vw,140px)", delay: "7s", dur: "14s" },
];

export default function HeroSection() {
	const t = useTranslations("home");
	const bgRef = useRef<HTMLDivElement>(null);

	/* Parallax suave: el fondo se mueve más despacio que el contenido */
	useEffect(() => {
		const onScroll = () => {
			if (!bgRef.current) return;
			bgRef.current.style.transform = `translateY(${window.scrollY * 0.32}px)`;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<section className="relative min-h-screen flex flex-col bg-pitch overflow-hidden">
			{/* ══════════════════════════════════════════
          Capas de fondo (parallax)
      ══════════════════════════════════════════ */}
			<div
				ref={bgRef}
				className="absolute inset-0 pointer-events-none will-change-transform"
				aria-hidden="true"
			>
				{/* Líneas de cancha — SVG overhead */}
				<svg
					className="absolute inset-0 w-full h-full"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="xMidYMid slice"
				>
					{/* Círculo central */}
					<circle
						cx="50%"
						cy="50%"
						r="17%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1.5"
						opacity="0.18"
					/>
					{/* Punto central */}
					<circle cx="50%" cy="50%" r="0.5%" fill="#00E676" opacity="0.35" />
					{/* Línea de medio campo */}
					<line
						x1="0"
						y1="50%"
						x2="100%"
						y2="50%"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.12"
					/>
					{/* Arco área izq */}
					<ellipse
						cx="0%"
						cy="50%"
						rx="7%"
						ry="13%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.11"
					/>
					{/* Arco área der */}
					<ellipse
						cx="100%"
						cy="50%"
						rx="7%"
						ry="13%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.11"
					/>
					{/* Portería izq */}
					<rect
						x="0"
						y="43%"
						width="3.5%"
						height="14%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.09"
					/>
					{/* Portería der */}
					<rect
						x="96.5%"
						y="43%"
						width="3.5%"
						height="14%"
						fill="none"
						stroke="#00E676"
						strokeWidth="1"
						opacity="0.09"
					/>
				</svg>

				{/* Glow radial — detrás de la card */}
				<div
					className="absolute animate-glow-hero"
					style={{
						top: "-15%",
						right: "-8%",
						width: "58%",
						height: "90%",
						background:
							"radial-gradient(ellipse at 68% 28%, rgba(0,230,118,0.22) 0%, rgba(0,230,118,0.09) 42%, transparent 70%)",
					}}
				/>

				{/* Números fantasma */}
				{GHOST.map(({ v, top, left, sz, delay, dur }) => (
					<span
						key={v}
						className="absolute font-display font-black text-ink select-none"
						style={{
							top,
							left,
							fontSize: sz,
							lineHeight: 1,
							opacity: 0.09,
							animation: `ghostFloat ${dur} ease-in-out ${delay} infinite`,
						}}
					>
						{v}
					</span>
				))}
			</div>

			{/* ══════════════════════════════════════════
          Contenido hero
      ══════════════════════════════════════════ */}
			<div className="relative z-10 flex-1 flex items-center px-5 py-20 sm:py-28">
				<div className="max-w-5xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
					{/* ── Columna izquierda ── */}
					<div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
						{/* City badge */}
						<span
							className="animate-fade-slide-up inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest"
							style={{ animationDelay: "0.05s", animationFillMode: "both" }}
						>
							<MapPin size={12} strokeWidth={2} />
							{t("hero.badge")}
						</span>

						{/* Headline — título conservado exactamente */}
						<h1
							className="animate-fade-slide-up font-display font-black uppercase leading-[0.88] tracking-tight"
							style={{
								fontSize: "clamp(3.8rem, 9.5vw, 7rem)",
								animationDelay: "0.2s",
								animationFillMode: "both",
							}}
						>
							{t("hero.titleLine1")}
							<br />
							<span className="text-brand-ink">{t("hero.titleLine2")}</span>
							<br />
							{t("hero.titleLine3")}
						</h1>

						{/* Subtexto */}
						<p
							className="animate-fade-slide-up text-ink-2 text-base sm:text-lg leading-relaxed max-w-sm"
							style={{ animationDelay: "0.4s", animationFillMode: "both" }}
						>
							{t("hero.subtextPrefix")}
							<strong className="text-ink font-semibold">{t("hero.subtextStrong")}</strong>
							{t("hero.subtextSuffix")}
						</p>

						{/* Nostalgia anticipada (P15) — capa cálida, no dominante */}
						<p
							className="animate-fade-slide-up text-sm text-ink-3 italic -mt-2"
							style={{ animationDelay: "0.5s", animationFillMode: "both" }}
						>
							{t("hero.nostalgiaLine")}
						</p>

						{/* CTA primario: el buscador (auto-referencia) */}
						<div
							className="animate-fade-slide-up w-full flex justify-center lg:justify-start"
							style={{ animationDelay: "0.6s", animationFillMode: "both" }}
						>
							<HeroPlayerSearch />
						</div>

						{/* CTA secundario */}
						<div
							className="animate-fade-slide-up"
							style={{ animationDelay: "0.7s", animationFillMode: "both" }}
						>
							<Link
								href="/ranking"
								className="inline-flex items-center justify-center gap-2 bg-surface-2 hover:bg-line border border-line text-ink font-bold px-7 py-3.5 rounded-xl text-sm transition"
							>
								<Trophy size={16} strokeWidth={2} />
								{t("hero.viewRanking")}
							</Link>
						</div>

						{/* Social proof micro-line */}
						<p
							className="animate-fade-slide-up text-xs text-ink-3"
							style={{ animationDelay: "0.8s", animationFillMode: "both" }}
						>
							{t("hero.socialProof")}
						</p>

						{/* Puerta para el organizador — abre su vista, no el registro en frío */}
						<Link
							href="/?vista=organizador"
							className="animate-fade-slide-up inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-brand-ink border border-line hover:border-brand/40 px-3.5 py-2 rounded-xl transition"
							style={{ animationDelay: "1s", animationFillMode: "both" }}
						>
							{t("hero.organizerPrompt")}
							<span className="text-brand-ink font-semibold">{t("hero.organizerPromptCta")}</span>
						</Link>
					</div>

					{/* ── Columna derecha — HeroCard ── */}
					<div className="w-full lg:flex-shrink-0" style={{ maxWidth: "320px" }}>
						<HeroCard />
					</div>
				</div>
			</div>

			{/* Scroll chevron */}
			<div className="relative z-10 flex justify-center pb-6" aria-hidden="true">
				<ChevronDown size={18} strokeWidth={2} className="text-ink-3 animate-bounce opacity-50" />
			</div>
		</section>
	);
}
