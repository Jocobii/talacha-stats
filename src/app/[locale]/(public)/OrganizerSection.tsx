"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { Globe, BarChart3, Share2, ChevronRight, CheckCircle } from "lucide-react";

const VALUE_PROPS = [
	{ Icon: Globe, nsKey: "visibility", delay: 80 },
	{ Icon: BarChart3, nsKey: "cityRanking", delay: 180 },
	{ Icon: Share2, nsKey: "shareableContent", delay: 280 },
] as const;

function ValueCard({
	Icon,
	nsKey,
	delay,
	visible,
}: {
	Icon: typeof Globe;
	nsKey: "visibility" | "cityRanking" | "shareableContent";
	delay: number;
	visible: boolean;
}) {
	const t = useTranslations("home");

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
				<p className="font-semibold text-ink text-sm mb-1">
					{t(`organizerSection.valueProps.${nsKey}.title`)}
				</p>
				<p className="text-ink-3 text-sm leading-relaxed">
					{t(`organizerSection.valueProps.${nsKey}.description`)}
				</p>
			</div>
		</div>
	);
}

export default function OrganizerSection() {
	const t = useTranslations("home");
	const perks = t.raw("organizerSection.perks") as string[];
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
							{t("organizerSection.eyebrow")}
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
							{t("organizerSection.titleLine1")}
							<br />
							<span className="text-brand-ink">{t("organizerSection.titleLine2")}</span>
							<br />
							{t("organizerSection.titleLine3")}
						</h2>

						{/* Subtexto */}
						<p
							className="text-ink-2 text-base leading-relaxed mb-8 max-w-sm"
							style={{
								opacity: visible ? 1 : 0,
								transition: "opacity 0.5s ease 0.2s",
							}}
						>
							{t("organizerSection.subtext")}
						</p>

						{/* Perks */}
						<ul
							className="space-y-2 mb-8"
							style={{
								opacity: visible ? 1 : 0,
								transition: "opacity 0.5s ease 0.3s",
							}}
						>
							{perks.map((perk) => (
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
								{t("organizerSection.primaryCta")}
								<ChevronRight size={16} strokeWidth={2} />
							</Link>
							<Link
								href="/login"
								className="text-sm text-ink-3 hover:text-ink transition-colors font-medium"
							>
								{t("organizerSection.secondaryCta")}
							</Link>
						</div>
					</div>

					{/* ── Columna derecha: value props ── */}
					<div className="flex flex-col gap-7">
						{VALUE_PROPS.map((vp) => (
							<ValueCard key={vp.nsKey} {...vp} visible={visible} />
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
							{t("organizerSection.bottomCta")}
							<ChevronRight size={14} strokeWidth={2} />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
