import type { Metadata } from "next";
import { Archivo, Oswald, Zilla_Slab } from "next/font/google";
import "../globals.css";
import TrackVisit from "@/shared/ui/TrackVisit";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { QueryProvider } from "@/shared/api/QueryProvider";
import { Toaster } from "@/shared/ui/Toaster";

// ── Root layout para TODO lo que queda FUERA de [locale] ─────────────────────
// admin, onboarding, login, register, verify-email — español-only, sin i18n
// (docs/I18N-PLAN.md §0, §4). Next.js no permite dos <html> en el mismo árbol,
// así que este es un root layout independiente (patrón "multiple root
// layouts" de Next.js) — hermano de app/[locale]/layout.tsx, no su padre.
// Duplica fonts/providers respecto a ese archivo a propósito: son dos árboles
// de render distintos (ver decisión registrada en el PR de este paso).

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

export const metadata: Metadata = {
	title: "TalachaStats — Panel",
	description: "Panel de administración de TalachaStats.",
	// No indexar: el panel admin nunca es contenido público (AGENTS.md §7.3).
	robots: { index: false, follow: false },
};

const antiFlash = String.raw`try{var m=localStorage.getItem("ts.theme.mode")||"dark";var t=localStorage.getItem("ts.theme.tone")||"cal";document.documentElement.dataset.theme=m;document.documentElement.dataset.tone=t;}catch(e){}`;

export default function ShellLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es" className="h-full">
			<head>
				{}
				<script dangerouslySetInnerHTML={{ __html: antiFlash }} />
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
