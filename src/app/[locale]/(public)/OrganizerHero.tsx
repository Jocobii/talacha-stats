import { getTranslations } from "next-intl/server";
import { Link } from "@/shared/i18n/navigation";
import {
	CalendarDays,
	ClipboardList,
	Trophy,
	GitBranch,
	Globe,
	Users,
	ChevronRight,
} from "lucide-react";

/* Solo features vivas en el producto (AGENTS §1.6) — nada de importación de Excel. */
const FEATURE_ICONS = [CalendarDays, ClipboardList, Trophy, GitBranch, Globe, Users];

export default async function OrganizerHero() {
	const t = await getTranslations("home");
	const features = t.raw("organizerHero.features") as string[];

	return (
		<section className="relative bg-pitch overflow-hidden px-5 py-16 sm:py-24">
			<div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
				{/* ── Columna izquierda: copy ── */}
				<div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
					<span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-2 border border-line text-ink-2 px-3 py-1.5 rounded-full uppercase tracking-widest">
						{t("organizerHero.badge")}
					</span>

					{/* IKEA effect: honra el trabajo que ya hace, no lo descalifica */}
					<h1
						className="font-display font-black uppercase leading-[0.9] tracking-tight"
						style={{ fontSize: "clamp(2.6rem, 7vw, 4.8rem)" }}
					>
						{t("organizerHero.titleLine1")}
						<br />
						<span className="text-brand-ink">{t("organizerHero.titleLine2Strong")}</span>
						{t("organizerHero.titleLine2Suffix")}
					</h1>

					<p className="text-ink-2 text-base sm:text-lg leading-relaxed max-w-md">
						{t("organizerHero.subtextPrefix")}
						<strong className="text-ink font-semibold">{t("organizerHero.subtextStrong")}</strong>
						{t("organizerHero.subtextSuffix")}
					</p>

					{/* Aversión a la pérdida + cronista (P3 + P15) */}
					<p className="text-sm text-ink-3 leading-relaxed max-w-md border-l-2 border-brand/40 pl-3 text-left">
						{t("organizerHero.lossAversionPrefix")}
						<strong className="text-ink font-semibold">
							{t("organizerHero.lossAversionStrong")}
						</strong>
						{t("organizerHero.lossAversionSuffix")}
					</p>

					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
						<Link
							href="/register"
							className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-pitch font-bold px-7 py-3.5 rounded-xl text-sm transition font-body"
						>
							{t("organizerHero.primaryCta")}
							<ChevronRight size={16} strokeWidth={2} />
						</Link>
						<Link
							href="/demo"
							className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-line border border-line text-ink font-bold px-7 py-3.5 rounded-xl text-sm transition"
						>
							{t("organizerHero.secondaryCta")}
						</Link>
					</div>

					{/* Anclaje de precio */}
					<p className="text-xs text-ink-3">
						{t("organizerHero.pricePrefix")}
						<strong className="text-brand-ink">{t("organizerHero.priceStrong")}</strong>
						{t("organizerHero.priceSuffix")}
					</p>
				</div>

				{/* ── Columna derecha: lo que tu liga obtiene ── */}
				<div className="w-full lg:w-auto lg:flex-shrink-0" style={{ maxWidth: "400px" }}>
					<div className="bg-surface border border-line rounded-2xl p-5 sm:p-6">
						<p className="text-[11px] font-bold text-brand-ink uppercase tracking-widest mb-4">
							{t("organizerHero.cardEyebrow")}
						</p>
						<ul className="space-y-3.5">
							{features.map((label, index) => {
								const Icon = FEATURE_ICONS[index];
								return (
									<li key={label} className="flex items-start gap-3 text-sm text-ink-2">
										<span className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
											<Icon size={15} strokeWidth={2} className="text-brand-ink" />
										</span>
										<span className="leading-snug pt-1.5">{label}</span>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
