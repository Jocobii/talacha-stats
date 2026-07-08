import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExcelNarratorWizard } from "@/features/narrator-analysis/ui/ExcelNarratorWizard";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";

type AnalisisExcelPageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AnalisisExcelPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "analysis" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("excel.meta.title"),
		description: t("excel.meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/analisis-excel"),
	};
}

// Flujo público — sin login ni token. Cualquiera puede usarlo.
export default async function AnalisisExcelPage({ params }: AnalisisExcelPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<div className="bg-surface flex-1 w-full">
			<ExcelNarratorWizard />
		</div>
	);
}
