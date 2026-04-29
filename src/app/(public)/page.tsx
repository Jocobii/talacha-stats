import type { Metadata } from "next";
import { Suspense }       from "react";
import HeroSection        from "./HeroSection";
import StatsBar           from "./StatsBar";
import LeaguesTeaser      from "./LeaguesTeaser";
import LeaderboardTeaser  from "./LeaderboardTeaser";
import FeaturesSection    from "./FeaturesSection";

export const metadata: Metadata = {
  title: "TalachaStats — Tu historial de goles en todas las ligas",
  description:
    "Estadísticas cross-liga para jugadores amateurs de fútbol 7 en Tijuana. Todos tus goles, todas tus ligas, un solo perfil.",
};

export default function HomePage() {
  return (
    <div className="text-ink flex flex-col flex-1">
      {/* Hero: fondo de cancha + glow + números fantasma + card animada */}
      <HeroSection />

      {/* Contadores */}
      <StatsBar />

      {/* Ligas activas — vitrina de organizaciones */}
      <Suspense>
        <LeaguesTeaser />
      </Suspense>

      {/* Mini leaderboard */}
      <LeaderboardTeaser />

      {/* Features con scroll reveal */}
      <FeaturesSection />
    </div>
  );
}
