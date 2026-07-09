import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/shared/i18n/navigation";
import {
	BarChart3,
	Trophy,
	Users,
	Zap,
	MapPin,
	ChevronRight,
	Mail,
	ExternalLink,
	Archive,
} from "lucide-react";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";
// Trophy y Users se usan en las secciones de features y nav interno

type AboutPageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "about" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/about"),
	};
}

/* ── Social icon components (Instagram + Facebook) ─────────────── */
function IconInstagram({ size = 18 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
			<circle cx="12" cy="12" r="4" />
			<circle cx="17.5" cy="6.5" r="0" fill="currentColor" stroke="none" />
			<circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
		</svg>
	);
}

function IconFacebook({ size = 18 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
		</svg>
	);
}

/* ── Page ───────────────────────────────────────────────────────── */
export default async function AboutPage({ params }: AboutPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("about");

	const whatIsFeatures = t.raw("whatIs.features") as { title: string; desc: string }[];
	const howItWorksSteps = t.raw("howItWorks.steps") as {
		step: string;
		title: string;
		desc: string;
	}[];
	const visionStats = t.raw("vision.stats") as { value: string; label: string }[];
	const whatIsIcons = [Users, BarChart3, Trophy];

	return (
		<div className="text-ink flex flex-col">
			{/* ── HERO ──────────────────────────────────────────────────── */}
			<section className="px-5 py-20 flex flex-col items-center text-center border-b border-line">
				<span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest mb-8">
					<MapPin size={12} strokeWidth={2} /> {t("hero.badge")}
				</span>

				<h1 className="font-display font-black text-5xl sm:text-7xl uppercase leading-[0.9] tracking-tight max-w-2xl">
					{t("hero.headline1")}
					<br />
					{t("hero.headline2")}
					<br />
					<span className="text-brand-ink">{t("hero.headline3")}</span>
				</h1>

				<p className="text-ink-2 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mt-7">
					{t.rich("hero.body", {
						strong: (chunks) => <strong className="text-ink">{chunks}</strong>,
					})}
				</p>
			</section>

			{/* ── EL PROBLEMA ───────────────────────────────────────────── */}
			<section className="px-5 py-16 max-w-3xl mx-auto w-full">
				<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
					{t("problem.eyebrow")}
				</p>
				<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-6">
					{t("problem.headline1")}
					<br />
					<span className="text-ink-2">{t("problem.headline2")}</span>
				</h2>
				<p className="text-ink-2 leading-relaxed text-sm sm:text-base max-w-xl">
					{t("problem.body")}
				</p>
			</section>

			{/* ── QUÉ ES ────────────────────────────────────────────────── */}
			<section className="bg-surface border-y border-line px-5 py-16">
				<div className="max-w-3xl mx-auto">
					<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
						{t("whatIs.eyebrow")}
					</p>
					<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-10">
						{t("whatIs.headline")}
					</h2>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
						{whatIsFeatures.map((f, i) => {
							const Icon = whatIsIcons[i];
							return (
								<div key={f.title} className="flex flex-col gap-3">
									<div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center shrink-0">
										<Icon size={20} className="text-brand-ink" strokeWidth={2} />
									</div>
									<p className="font-bold text-ink text-sm">{f.title}</p>
									<p className="text-ink-3 text-sm leading-relaxed">{f.desc}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ── CÓMO FUNCIONA ─────────────────────────────────────────── */}
			<section className="px-5 py-16 max-w-3xl mx-auto w-full">
				<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
					{t("howItWorks.eyebrow")}
				</p>
				<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-10">
					{t("howItWorks.headline1")}
					<br />
					<span className="text-brand-ink">{t("howItWorks.headline2")}</span>
				</h2>

				<div className="flex flex-col gap-0">
					{howItWorksSteps.map(({ step, title, desc }, i, arr) => (
						<div key={step} className="flex gap-5">
							<div className="flex flex-col items-center">
								<div className="w-10 h-10 rounded-full bg-surface-2 border border-line flex items-center justify-center shrink-0">
									<span className="font-display font-black text-xs text-brand-ink">{step}</span>
								</div>
								{i < arr.length - 1 && <div className="w-px flex-1 bg-line my-2" />}
							</div>
							<div className={`pb-10 ${i === arr.length - 1 ? "pb-0" : ""}`}>
								<p className="font-bold text-ink text-sm mb-1.5">{title}</p>
								<p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* ── VISIÓN ────────────────────────────────────────────────── */}
			<section className="bg-surface border-y border-line px-5 py-16">
				<div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-10 items-start">
					<div className="flex-1">
						<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
							{t("vision.eyebrow")}
						</p>
						<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-5">
							{t("vision.headline1")}
							<br />
							<span className="text-brand-ink">{t("vision.headline2")}</span>
						</h2>
						<p className="text-ink-2 text-sm leading-relaxed max-w-md">{t("vision.body1")}</p>
						<p className="text-ink-2 text-sm leading-relaxed max-w-md mt-4">{t("vision.body2")}</p>
					</div>

					<div className="flex flex-col gap-4 shrink-0">
						{visionStats.map(({ value, label }) => (
							<div
								key={label}
								className="bg-surface-2 border border-line rounded-xl px-6 py-4 text-center min-w-[140px]"
							>
								<p className="font-display font-black text-3xl text-brand-ink">{value}</p>
								<p className="text-ink-3 text-xs font-semibold uppercase tracking-wide mt-1">
									{label}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── BAÚL DE RECUERDOS ─────────────────────────────────────── */}
			<section className="px-5 py-16 max-w-3xl mx-auto w-full">
				<div className="flex flex-col items-center text-center">
					<div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center mb-6">
						<Archive size={20} className="text-brand-ink" strokeWidth={2} />
					</div>
					<p className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-4">
						{t("vault.eyebrow")}
					</p>
					<h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-tight mb-6">
						{t("vault.headline1")}
						<br />
						<span className="text-ink-2">{t("vault.headline2")}</span>
					</h2>
					<p className="text-ink-2 leading-relaxed text-sm sm:text-base max-w-xl">
						{t("vault.body")}
					</p>
					<p className="text-ink-3 text-xs font-semibold uppercase tracking-wide mt-6 bg-surface-2 border border-line rounded-full px-4 py-2">
						{t("vault.highlight")}
					</p>
				</div>
			</section>

			{/* ── CTA ORGANIZADORES ─────────────────────────────────────── */}
			<section className="px-5 py-16 max-w-3xl mx-auto w-full">
				<div className="bg-surface-2 border border-brand/20 rounded-2xl px-7 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-3">
							<Zap size={16} className="text-brand-ink" strokeWidth={2} />
							<p className="text-xs font-bold text-brand-ink uppercase tracking-widest">
								{t("cta.eyebrow")}
							</p>
						</div>
						<h3 className="font-display font-black text-2xl sm:text-3xl uppercase leading-tight mb-3">
							{t("cta.headline")}
						</h3>
						<p className="text-ink-2 text-sm leading-relaxed max-w-sm">{t("cta.body")}</p>
					</div>
					<div className="flex flex-col gap-3 shrink-0">
						<a
							href="mailto:talachastats@gmail.com"
							className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-6 py-3.5 rounded-xl text-sm transition"
						>
							<Mail size={16} strokeWidth={2} />
							{t("cta.activate")}
						</a>
						<Link
							href="/demo"
							className="flex items-center justify-center gap-2 bg-surface border border-line text-ink-2 hover:text-ink font-semibold px-6 py-3.5 rounded-xl text-sm transition"
						>
							<ChevronRight size={16} strokeWidth={2} />
							{t("cta.viewDemo")}
						</Link>
					</div>
				</div>
			</section>

			{/* ── REDES SOCIALES ────────────────────────────────────────── */}
			<section className="bg-surface border-t border-line px-5 py-12">
				<div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
					<div>
						<p className="font-display font-black text-lg uppercase tracking-tight text-ink mb-1">
							{t("social.title")}
						</p>
						<p className="text-ink-3 text-xs">{t("social.subtitle")}</p>
					</div>
					<div className="flex gap-3">
						<a
							href="https://www.instagram.com/talachastats/"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2.5 bg-surface-2 hover:bg-line border border-line text-ink-2 hover:text-ink font-semibold px-5 py-3 rounded-xl text-sm transition"
						>
							<IconInstagram size={16} />
							Instagram
							<ExternalLink size={12} className="text-ink-3" />
						</a>
						<a
							href="https://www.facebook.com/talachastats"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2.5 bg-surface-2 hover:bg-line border border-line text-ink-2 hover:text-ink font-semibold px-5 py-3 rounded-xl text-sm transition"
						>
							<IconFacebook size={16} />
							Facebook
							<ExternalLink size={12} className="text-ink-3" />
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}
