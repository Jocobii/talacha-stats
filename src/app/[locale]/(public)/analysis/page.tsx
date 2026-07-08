import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AnalysisView from "./AnalysisView";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";

type AnalysisPageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AnalysisPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "analysis" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/analysis"),
	};
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <AnalysisView />;
}
