import type { Metadata } from "next";
import { Archivo, Oswald, Zilla_Slab } from "next/font/google";
import "./globals.css";
import TrackVisit from "@/shared/ui/TrackVisit";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { QueryProvider } from "@/shared/api/QueryProvider";
import { Toaster } from "@/shared/ui/Toaster";

// ── Tipografías del catálogo org-theme (shared/org-theme/fonts.ts) ───────────
// Se declaran aquí (una sola vez, subseteadas) y exponen CSS variables que
// consumen FontPicker y el scope de la org. La default de la app no cambia.
const fontMarcador = Oswald({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-org-marcador",
	display: "swap",
});
const fontModerna = Archivo({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-org-moderna",
	display: "swap",
});
const fontSlab = Zilla_Slab({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-org-slab",
	display: "swap",
});
const orgFontVariables = `${fontMarcador.variable} ${fontModerna.variable} ${fontSlab.variable}`;

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: "TalachaStats | Gestión de ligas de fútbol gratis — Tijuana",
		template: "%s | TalachaStats",
	},
	description:
		"Sistema gratuito para administrar ligas de fútbol amateur en Tijuana. Tabla de posiciones, goleadores, sorteo automático y estadísticas de jugadores. Empieza gratis hoy.",
	keywords: [
		"gestión de ligas de fútbol",
		"sistema de gestión liga futbol",
		"administrar liga de futbol gratis",
		"app liga futbol amateur",
		"software torneo futbol gratis",
		"estadísticas fútbol Tijuana",
		"fútbol 7 Tijuana",
	],
	openGraph: {
		siteName: "TalachaStats",
		type: "website",
		title: "TalachaStats | Gestión de ligas de fútbol gratis — Tijuana",
		description:
			"Sistema gratuito para administrar ligas de fútbol amateur. Tabla de posiciones, goleadores y sorteo automático. Empieza gratis hoy.",
	},
	twitter: {
		card: "summary_large_image",
		title: "TalachaStats | Gestión de ligas de fútbol gratis",
		description: "Sistema gratuito para administrar ligas de fútbol amateur en Tijuana.",
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "TalachaStats",
	url: siteUrl,
	applicationCategory: "SportsApplication",
	operatingSystem: "Web",
	inLanguage: "es",
	description:
		"Sistema gratuito para administrar ligas de fútbol amateur. Tabla de posiciones, goleadores, sorteo de jornadas y estadísticas de jugadores.",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "MXN",
		availability: "https://schema.org/InStock",
		description: "Plan gratuito disponible para organizadores de ligas amateur",
	},
	featureList: [
		"Tabla de posiciones automática",
		"Estadísticas de goleadores",
		"Sorteo de jornadas",
		"Perfil público de jugadores",
		"Importación de datos desde Excel",
	],
	areaServed: {
		"@type": "City",
		name: "Tijuana",
		addressCountry: "MX",
	},
};

const antiFlash = String.raw`try{var m=localStorage.getItem("ts.theme.mode")||"dark";var t=localStorage.getItem("ts.theme.tone")||"cal";document.documentElement.dataset.theme=m;document.documentElement.dataset.tone=t;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es" className="h-full">
			<head>
				{}
				<script dangerouslySetInnerHTML={{ __html: antiFlash }} />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body className={`min-h-full antialiased ${orgFontVariables}`}>
				<ThemeProvider>
					<QueryProvider>
						<TrackVisit />
						<Analytics />
						{children}
						<Toaster />
					</QueryProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
