"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, Trophy, Search, ChevronDown } from "lucide-react";
import HeroCard from "./HeroCard";

/* Números fantasma — stats reales que flotan en el fondo */
const GHOST = [
  { v: "47",  top: "10%",  left: "4%",   sz: "clamp(90px,12vw,170px)", delay: "0s",   dur: "13s" },
  { v: "89",  top: "62%",  left: "1%",   sz: "clamp(65px,8vw,115px)",  delay: "4.5s", dur: "16s" },
  { v: "#8",  top: "14%",  left: "65%",  sz: "clamp(110px,14vw,200px)",delay: "2s",   dur: "11s" },
  { v: "3",   top: "70%",  left: "77%",  sz: "clamp(75px,10vw,140px)", delay: "7s",   dur: "14s" },
];

export default function HeroSection() {
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
          <circle cx="50%" cy="50%" r="17%"  fill="none" stroke="#00E676" strokeWidth="1"   opacity="0.07" />
          {/* Punto central */}
          <circle cx="50%" cy="50%" r="0.4%" fill="#00E676" opacity="0.15" />
          {/* Línea de medio campo */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00E676" strokeWidth="0.8" opacity="0.05" />
          {/* Arco área izq */}
          <ellipse cx="0%"   cy="50%" rx="7%"  ry="13%" fill="none" stroke="#00E676" strokeWidth="0.8" opacity="0.045" />
          {/* Arco área der */}
          <ellipse cx="100%" cy="50%" rx="7%"  ry="13%" fill="none" stroke="#00E676" strokeWidth="0.8" opacity="0.045" />
          {/* Portería izq */}
          <rect x="0"   y="43%" width="3.5%" height="14%" fill="none" stroke="#00E676" strokeWidth="0.8" opacity="0.035" />
          {/* Portería der */}
          <rect x="96.5%" y="43%" width="3.5%" height="14%" fill="none" stroke="#00E676" strokeWidth="0.8" opacity="0.035" />
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
              "radial-gradient(ellipse at 68% 28%, rgba(0,230,118,0.13) 0%, rgba(0,230,118,0.05) 42%, transparent 70%)",
          }}
        />

        {/* Números fantasma */}
        {GHOST.map(({ v, top, left, sz, delay, dur }) => (
          <span
            key={v}
            className="absolute font-display font-black text-ink select-none"
            style={{
              top, left,
              fontSize: sz,
              lineHeight: 1,
              opacity: 0.038,
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
              Tijuana · Fútbol Amateur
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
              Tus goles<br />
              <span className="text-brand">hablan</span><br />
              por ti.
            </h1>

            {/* Subtexto */}
            <p
              className="animate-fade-slide-up text-ink-2 text-base sm:text-lg leading-relaxed max-w-sm"
              style={{ animationDelay: "0.4s", animationFillMode: "both" }}
            >
              Juegas en varias ligas de Tijuana.
              TalachaStats reúne tus estadísticas de{" "}
              <strong className="text-ink font-semibold">todas tus ligas</strong>{" "}
              en un solo perfil que puedes compartir.
            </p>

            {/* CTAs */}
            <div
              className="animate-fade-slide-up flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
              style={{ animationDelay: "0.6s", animationFillMode: "both" }}
            >
              <Link
                href="/ranking"
                className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-7 py-3.5 rounded-xl text-sm transition font-body"
              >
                <Trophy size={16} strokeWidth={2} />
                Ver ranking
              </Link>
              <Link
                href="/players"
                className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-line border border-line text-ink font-bold px-7 py-3.5 rounded-xl text-sm transition"
              >
                <Search size={16} strokeWidth={2} />
                Buscar jugadores
              </Link>
            </div>

            {/* Social proof micro-line */}
            <p
              className="animate-fade-slide-up text-xs text-ink-3"
              style={{ animationDelay: "0.8s", animationFillMode: "both" }}
            >
              Ya hay jugadores de Tijuana en el ranking. ¿Estás tú?
            </p>
          </div>

          {/* ── Columna derecha — HeroCard ── */}
          <div
            className="w-full lg:flex-shrink-0"
            style={{ maxWidth: "320px" }}
          >
            <HeroCard />
          </div>

        </div>
      </div>

      {/* Scroll chevron */}
      <div className="relative z-10 flex justify-center pb-6" aria-hidden="true">
        <ChevronDown
          size={18}
          strokeWidth={2}
          className="text-ink-3 animate-bounce opacity-50"
        />
      </div>

    </section>
  );
}
