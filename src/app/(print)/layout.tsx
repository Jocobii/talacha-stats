import type { Metadata } from "next";
import { Archivo, Archivo_Narrow, Space_Mono } from "next/font/google";

// ── Root layout independiente para las hojas de cédula imprimibles ─────────
// Mismo patrón "multiple root layouts" que app/(shell)/layout.tsx: un árbol
// de render aparte, sin ThemeProvider/org-theme/Tailwind globals — la hoja
// usa la paleta neutra fija de `template.html` (docs/CEDULA-IMPRESA-SPEC.md
// §7: "sin fondos oscuros... papel blanco, texto negro"), no el tema de la
// organización (eso es §11 del plan, fuera de alcance de esta versión).

const fontNarrow = Archivo_Narrow({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-cedula-narrow",
	display: "swap",
});
const fontDisplay = Archivo({
	subsets: ["latin"],
	weight: ["700", "800", "900"],
	variable: "--font-cedula-display",
	display: "swap",
});
const fontMono = Space_Mono({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-cedula-mono",
	display: "swap",
});
const cedulaFontVariables = `${fontNarrow.variable} ${fontDisplay.variable} ${fontMono.variable}`;

export const metadata: Metadata = {
	title: "Cédula de partido — TalachaStats",
	robots: { index: false, follow: false },
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es">
			<body className={cedulaFontVariables}>
				{children}
				<style>{`
					* { box-sizing: border-box; margin: 0; padding: 0; }
					html { background: #e9e9ec; }
					body { padding: 24px 0; }
					@page { size: Letter portrait; margin: 0; }
					@media print {
						html { background: #fff; }
						body { padding: 0; }
					}
				`}</style>
			</body>
		</html>
	);
}
