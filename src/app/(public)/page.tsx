import type { Metadata } from "next";
import { cookies } from "next/headers";
import HeroSection from "./HeroSection";
import OrganizerHero from "./OrganizerHero";
import StatsBar from "./StatsBar";
import LeaderboardTeaser from "./LeaderboardTeaser";
import LeaguesShowcase from "./LeaguesShowcase";
import OrganizerSection from "./OrganizerSection";
import FeaturesSection from "./FeaturesSection";
import HomeViews from "./HomeViews";
import { HOME_VIEW_COOKIE, HOME_VIEW_QUERY_PARAM, resolveHomeView } from "./home-view";
import { getLeaguesShowcase } from "@/entities/organization";
import { getActiveCity } from "@/shared/lib/active-city";

export const metadata: Metadata = {
	title: "TalachaStats | Sistema de gestión de ligas de fútbol gratis en Tijuana",
	description:
		"Administra tu liga de fútbol amateur gratis en Tijuana. Tabla de posiciones automática, goleadores, sorteo de jornadas y perfil público para cada jugador. Sin cuotas.",
	alternates: {
		canonical: "/",
	},
};

type HomePageProps = {
	searchParams: Promise<{ [HOME_VIEW_QUERY_PARAM]?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
	const [params, cookieStore, city] = await Promise.all([searchParams, cookies(), getActiveCity()]);
	const showcaseLeagues = await getLeaguesShowcase(city, 6);
	const initialView = resolveHomeView(
		params[HOME_VIEW_QUERY_PARAM],
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
						<LeaderboardTeaser />
						<LeaguesShowcase leagues={showcaseLeagues} />
						<OrganizerSection />
						<FeaturesSection />
					</>
				}
				organizador={
					<>
						<OrganizerHero />
						<StatsBar />
						<LeaguesShowcase leagues={showcaseLeagues} />
					</>
				}
			/>
		</div>
	);
}
