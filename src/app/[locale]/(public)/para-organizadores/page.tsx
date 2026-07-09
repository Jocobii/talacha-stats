import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/shared/i18n/navigation";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates, ogLocale } from "@/shared/i18n/seo";

type ParaOrganizadoresPageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ParaOrganizadoresPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "paraOrganizadores" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/para-organizadores"),
		openGraph: {
			title: t("meta.ogTitle"),
			description: t("meta.ogDescription"),
			locale: ogLocale(appLocale),
		},
	};
}

export default async function ParaOrganizadoresPage({ params }: ParaOrganizadoresPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("paraOrganizadores");

	const features = t.raw("features") as { title: string; description: string }[];
	const faqs = t.raw("faqs") as { q: string; a: string }[];

	return (
		<main>
			{/* Hero */}
			<section className="px-6 py-16 sm:py-24 max-w-3xl mx-auto text-center">
				<p className="text-brand-ink text-sm font-semibold uppercase tracking-widest mb-4">
					{t("hero.eyebrow")}
				</p>
				<h1 className="font-display font-extrabold text-4xl sm:text-5xl text-ink leading-tight mb-6">
					{t("hero.headline")}
				</h1>
				<p className="text-ink-2 text-lg leading-relaxed mb-8 max-w-xl mx-auto">{t("hero.body")}</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Link href="/register" className="btn-primary text-base px-8 py-3 rounded-xl font-bold">
						{t("hero.ctaRegister")}
					</Link>
					<Link href="/ligas" className="btn-ghost text-base px-8 py-3 rounded-xl">
						{t("hero.ctaViewLigas")}
					</Link>
				</div>
				<p className="text-ink-3 text-sm mt-4">{t("hero.disclaimer")}</p>
			</section>

			{/* Features */}
			<section className="px-6 py-12 max-w-4xl mx-auto">
				<h2 className="font-display font-extrabold text-2xl text-ink text-center mb-10">
					{t("featuresTitle")}
				</h2>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((f) => (
						<div key={f.title} className="bg-surface-2 rounded-xl p-5 border border-line">
							<h3 className="font-display font-bold text-ink text-base mb-2">{f.title}</h3>
							<p className="text-ink-2 text-sm leading-relaxed">{f.description}</p>
						</div>
					))}
				</div>
			</section>

			{/* El costo de no hacerlo (aversión a la pérdida, cierre positivo) */}
			<section className="px-6 py-12 max-w-2xl mx-auto text-center">
				<div className="bg-surface-2 rounded-2xl p-8 border border-line">
					<p className="text-ink text-lg leading-relaxed mb-2">{t("costSection.body")}</p>
					<p className="text-brand-ink text-sm font-semibold">{t("costSection.highlight")}</p>
				</div>
			</section>

			{/* FAQ */}
			<section className="px-6 py-12 max-w-2xl mx-auto">
				<h2 className="font-display font-extrabold text-2xl text-ink text-center mb-8">
					{t("faqTitle")}
				</h2>
				<div className="space-y-5">
					{faqs.map((faq) => (
						<div key={faq.q} className="border-b border-line pb-5">
							<h3 className="font-semibold text-ink mb-1">{faq.q}</h3>
							<p className="text-ink-2 text-sm leading-relaxed">{faq.a}</p>
						</div>
					))}
				</div>
			</section>

			{/* CTA final */}
			<section className="px-6 py-16 text-center">
				<h2 className="font-display font-extrabold text-3xl text-ink mb-4">
					{t("finalCta.headline")}
				</h2>
				<p className="text-ink-2 mb-6">{t("finalCta.body")}</p>
				<Link href="/register" className="btn-primary text-base px-10 py-3 rounded-xl font-bold">
					{t("finalCta.cta")}
				</Link>
			</section>
		</main>
	);
}
