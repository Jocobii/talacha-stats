import type { Metadata } from "next";
import { Archivo, Oswald, Zilla_Slab } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import TrackVisit from "@/shared/ui/TrackVisit";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { QueryProvider } from "@/shared/api/QueryProvider";
import { Toaster } from "@/shared/ui/Toaster";
import { routing } from "@/shared/i18n/routing";

// ── Root layout de la superficie pública i18n ────────────────────────────────
// Root real (con su propio <html>) para que next-intl pueda habilitar render
// estático (setRequestLocale) y el `lang` sea correcto por locale — Next.js no
// permite leer esto de forma confiable desde un root layout ancestro sin
// forzar dynamic rendering. Hermano de app/(shell)/layout.tsx, no su hijo.
// Ver docs/I18N-PLAN.md §4; decisión "multiple root layouts" registrada en el
// PR de este paso (duplica fonts/providers a propósito).

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

// TODO(i18n step 6): localizar title/description/keywords vía getTranslations
// y agregar alternates.languages (hreflang) por página — hoy sigue siendo el
// mismo copy estático en español que tenía el root layout original.
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

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	// Habilita render estático de las páginas públicas (next-intl docs §routing/setup).
	setRequestLocale(locale);

	return (
		<html lang={locale} className="h-full">
			<head>
				{}
				<script dangerouslySetInnerHTML={{ __html: antiFlash }} />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body className={`min-h-full antialiased ${orgFontVariables}`}>
				<NextIntlClientProvider>
					<ThemeProvider>
						<QueryProvider>
							<TrackVisit />
							<Analytics />
							{children}
							<Toaster />
						</QueryProvider>
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
