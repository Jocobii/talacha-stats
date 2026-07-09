/**
 * features/org-theming/ui/ThemePreviewCard.tsx
 *
 * Mini-mock de la página pública pintado DIRECTO con los tokens recibidos
 * (inline styles, no CSS vars): lo que se ve aquí es exactamente lo que
 * produce buildThemeTokens — el mismo objeto que consumirán la página
 * pública y las imágenes compartibles. TONTO y server-safe.
 */

import type { OrgThemeTokens } from "@/shared/org-theme";

type ThemePreviewCardProps = {
	tokens: OrgThemeTokens;
	orgName?: string;
	/** CSS font-family (ej. "var(--font-org-marcador)"); undefined = default. */
	fontFamily?: string;
	/** URL del escudo. Vacío/undefined = iniciales del nombre (fallback). */
	logoUrl?: string;
};

function initials(name: string): string {
	const words = name.trim().split(/\s+/);
	const first = words[0]?.[0] ?? "T";
	const second = words[1]?.[0] ?? words[0]?.[1] ?? "L";
	return (first + second).toUpperCase();
}

const ROWS = [
	{ pos: 1, team: "Deportivo Centella", pts: 21, leader: true },
	{ pos: 2, team: "Atlético Mirador", pts: 18, leader: false },
	{ pos: 3, team: "Real Otay", pts: 16, leader: false },
];

export function ThemePreviewCard({
	tokens,
	orgName = "Tu organización",
	fontFamily,
	logoUrl,
}: ThemePreviewCardProps) {
	return (
		<div
			className="overflow-hidden rounded-xl border"
			style={{ backgroundColor: tokens.surface, borderColor: tokens.line, fontFamily }}
		>
			{/* Header estilo hub de la org */}
			<div
				className="flex items-center justify-between gap-3 px-4 py-3"
				style={{ backgroundColor: tokens.primary, color: tokens.primaryInk }}
			>
				<span className="flex min-w-0 items-center gap-2.5">
					<span
						className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-black"
						style={{ backgroundColor: "rgba(0,0,0,.18)" }}
					>
						{logoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element -- preview vive dentro de un iframe/panel, no de next/image
							<img src={logoUrl} alt="" className="h-full w-full object-cover" />
						) : (
							initials(orgName)
						)}
					</span>
					<span className="truncate text-sm font-semibold">{orgName}</span>
				</span>
				<span
					className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
					style={{ backgroundColor: tokens.accent, color: tokens.accentInk }}
				>
					Jornada 7
				</span>
			</div>

			{/* Mini tabla de posiciones */}
			<div className="p-3">
				<p className="mb-2 text-xs font-medium uppercase" style={{ color: tokens.inkDim }}>
					Tabla de posiciones
				</p>
				<div className="space-y-1">
					{ROWS.map((row) => (
						<div
							key={row.pos}
							className="flex items-center justify-between rounded px-2 py-1.5 text-sm"
							style={
								row.leader
									? { backgroundColor: tokens.tint, border: `1px solid ${tokens.tintBd}` }
									: { backgroundColor: tokens.surface2 }
							}
						>
							<span style={{ color: tokens.ink }}>
								<span className="mr-2 font-mono text-xs" style={{ color: tokens.inkDim }}>
									{row.pos}
								</span>
								{row.team}
							</span>
							<span className="font-semibold" style={{ color: tokens.ink }}>
								{row.pts}
							</span>
						</div>
					))}
				</div>

				<button
					type="button"
					tabIndex={-1}
					className="mt-3 w-full cursor-default rounded-lg py-2 text-sm font-semibold"
					style={{ backgroundColor: tokens.primary, color: tokens.primaryInk }}
				>
					Compartir tabla
				</button>
			</div>
		</div>
	);
}
