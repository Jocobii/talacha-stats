"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Trophy, Star, Search } from "lucide-react";

type Feature = {
	Icon: typeof Trophy;
	nsKey: "ranking" | "leaderboard" | "shareableProfile";
	delay: number;
};

const FEATURES: Feature[] = [
	{ Icon: Trophy, nsKey: "ranking", delay: 0 },
	{ Icon: Star, nsKey: "leaderboard", delay: 130 },
	{ Icon: Search, nsKey: "shareableProfile", delay: 260 },
];

function FeatureCard({ Icon, nsKey, delay }: Feature) {
	const t = useTranslations("home");
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
			<p className="font-bold text-ink text-sm">{t(`features.${nsKey}.title`)}</p>
			<p className="text-ink-3 text-sm leading-relaxed">{t(`features.${nsKey}.description`)}</p>
		</div>
	);
}

export default function FeaturesSection() {
	return (
		<section className="bg-surface border-t border-line px-5 py-16">
			<div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
				{FEATURES.map((f) => (
					<FeatureCard key={f.nsKey} {...f} />
				))}
			</div>
		</section>
	);
}
