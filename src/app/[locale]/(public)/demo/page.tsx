import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DemoView from "./DemoView";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";

type DemoPageProps = {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ vista?: string; view?: string }>;
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

export default async function DemoPage({ params, searchParams }: DemoPageProps) {
	const { locale } = await params;
	const { vista, view } = await searchParams;
	setRequestLocale(locale);

	// Deep-link desde el CTA de organizador → arranca en la vista de coordinador
	const coordinatorValues = ["coordinador", "coordinators", "organizador", "organizer"];
	const initialView =
		coordinatorValues.includes(vista ?? "") || coordinatorValues.includes(view ?? "")
			? "coordinators"
			: "players";

	return <DemoView initialView={initialView} />;
}
