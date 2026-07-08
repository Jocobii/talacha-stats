import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DemoView from "./DemoView";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";

type DemoPageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "demo" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/demo"),
	};
}

export default async function DemoPage({ params }: DemoPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <DemoView />;
}
