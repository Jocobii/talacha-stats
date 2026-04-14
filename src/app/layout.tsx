import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutbolStats — Panel de administración",
  description: "Sistema de estadísticas para ligas de fútbol amateur",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
