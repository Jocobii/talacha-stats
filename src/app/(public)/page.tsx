import type { Metadata } from "next";
import HeroSection from "./HeroSection";
import StatsBar from "./StatsBar";
import LeaderboardTeaser from "./LeaderboardTeaser";
import LeaguesShowcase from "./LeaguesShowcase";
import OrganizerSection from "./OrganizerSection";
import FeaturesSection from "./FeaturesSection";
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

export default async function HomePage() {
	const city = await getActiveCity();
	const showcaseLeagues = await getLeaguesShowcase(city, 6);

	return (
		<div className="text-ink flex flex-col flex-1">
			{/* Para el jugador — hero con puerta al organizador */}
			<HeroSection />

			{/* Idea 1: números de la plataforma que cuentan al hacer scroll */}
			<StatsBar />

			{/* Idea 3: mini ranking — jugadores como protagonistas */}
			<LeaderboardTeaser />

			{/* Idea 2: vitrina de ligas registradas — datos reales de DB */}
			<LeaguesShowcase leagues={showcaseLeagues} />

			{/* Idea 1: sección "Para tu liga" — el organizador como protagonista */}
			<OrganizerSection />

			{/* Features generales con scroll reveal */}
			<FeaturesSection />
		</div>
	);
}
