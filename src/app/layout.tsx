import type { Metadata } from "next";
import "./globals.css";
import TrackVisit from "@/shared/ui/TrackVisit";
import NavigationProgress from "@/shared/ui/NavigationProgress";
import { Analytics } from "@vercel/analytics/next"

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "TalachaStats — Tu historial de goles en todas las ligas",
  description: "Estadísticas cross-liga para jugadores amateurs de fútbol en Tijuana.",
  openGraph: {
    siteName: "TalachaStats",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full antialiased">
        <NavigationProgress />
        <TrackVisit />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
