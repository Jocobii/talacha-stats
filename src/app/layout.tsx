import type { Metadata } from "next";
import "./globals.css";
import TrackVisit from "@/shared/ui/TrackVisit";

export const metadata: Metadata = {
  title: "TalachaStats — Tu historial de goles en todas las ligas",
  description: "Estadísticas cross-liga para jugadores amateurs de fútbol 7 en Tijuana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full antialiased">
        <TrackVisit />
        {children}
      </body>
    </html>
  );
}
