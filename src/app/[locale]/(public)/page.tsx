import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";
import HeroSection from "./HeroSection";
import OrganizerHero from "./OrganizerHero";
import OrganizerBeforeAfter from "./OrganizerBeforeAfter";
import OrganizerSteps from "./OrganizerSteps";
import VaultSection from "./VaultSection";
import StatsBar from "./StatsBar";
import LeaderboardTeaser from "./LeaderboardTeaser";
import LeaguesShowcase from "./LeaguesShowcase";
import OrganizerSection from "./OrganizerSection";
import FeaturesSection from "./FeaturesSection";
import HomeViews from "./HomeViews";
import {
	HOME_VIEW_COOKIE,
	HOME_VIEW_QUERY_PARAM,
	HOME_VIEW_REF_PARAM,
	resolveHomeView,
} from "./home-view";
import { getLeaguesShowcase } from "@/entities/organization";
import { getActiveCity } from "@/shared/lib/active-city";

type HomePageProps = {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{
		[HOME_VIEW_QUERY_PARAM]?: string;
		[HOME_VIEW_REF_PARAM]?: string;
	}>;
};

export async function generateMetadata({
	params,
}: Pick<HomePageProps, "params">): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "home" });
	const appLocale = isAppLocale(locale) ? locale : "es";

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: buildLocaleAlternates(appLocale, "/"),
		// Sin `openGraph` propio: hereda el objeto completo (incluido `locale`,
		// ya localizado) del layout raíz — si esta página definiera su propio
		// `openGraph`, reemplazaría el del layout entero en vez de fusionarse.
	};
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const [searchParamsValue, cookieStore, city] = await Promise.all([
		searchParams,
		cookies(),
		getActiveCity(),
	]);
	const showcaseLeagues = await getLeaguesShowcase(city, 6);
	const initialView = resolveHomeView(
		searchParamsValue[HOME_VIEW_QUERY_PARAM],
		searchParamsValue[HOME_VIEW_REF_PARAM],
		cookieStore.get(HOME_VIEW_COOKIE)?.value,
	);

	return (
		<div className="text-ink flex flex-col flex-1">
			{/* key: si cambia ?vista= por navegación, el estado del toggle se reinicia */}
			<HomeViews
				key={initialView}
				initialView={initialView}
				jugador={
					<>
						<HeroSection />
						<StatsBar />
						<VaultSection />
						<LeaderboardTeaser />
						<LeaguesShowcase leagues={showcaseLeagues} />
						<OrganizerSection />
						<FeaturesSection />
					</>
				}
				organizador={
					<>
						<OrganizerHero />
						<OrganizerBeforeAfter />
						<OrganizerSteps />
						<StatsBar />
						<LeaguesShowcase leagues={showcaseLeagues} />
					</>
				}
			/>
		</div>
	);
}
