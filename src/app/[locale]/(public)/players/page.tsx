import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PlayersView from "./PlayersView";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";

type PlayersPageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PlayersPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "players" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/players"),
	};
}

export default async function PlayersPage({ params }: PlayersPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);
	const tCommon = await getTranslations("common");

	return (
		<Suspense
			fallback={<p className="text-sm text-ink-3 py-8 text-center">{tCommon("loading")}</p>}
		>
			<PlayersView />
		</Suspense>
	);
}
