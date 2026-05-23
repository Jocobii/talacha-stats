/**
 * shared/brand/Watermark.tsx
 * Sello Talacha — franja inferior para assets compartibles (satori-compatible).
 *
 * Regla C1: aparece en el 100% de las imágenes públicas.
 * Regla C5: fuente única de marca — importar siempre desde aquí.
 *
 * Solo usa flexbox + estilos inline (limitación de satori/next/og).
 */

import { BRAND_PALETTE as C } from "./palette";
import { BRAND } from "./tokens";

type WatermarkProps = {
	/** Deep-link legible: https://talachastats.com/org/liga?ref=asset&t=... */
	deepLink: string;
	/** QR como data URL PNG (de buildQrDataUrl). Si null, muestra URL en texto. */
	qrDataUrl: string | null;
	/** Nombre de la liga para co-branding */
	leagueName?: string;
	/** Logo de la organización (URL pública). Opcional. */
	orgLogoUrl?: string;
};

/** Dot decorativo de marca */
function BrandDot() {
	return (
		<div
			style={{
				width: 14,
				height: 14,
				borderRadius: 7,
				background: C.brand,
				display: "flex",
				flexShrink: 0,
			}}
		/>
	);
}

/** Bloque QR o fallback con URL legible */
function QrBlock({ qrDataUrl, deepLink }: { qrDataUrl: string | null; deepLink: string }) {
	const shortUrl = deepLink.replace(/^https?:\/\//, "").replace(/\?.+$/, "");
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 6,
			}}
		>
			<div
				style={{
					width: 100,
					height: 100,
					background: qrDataUrl ? "transparent" : C.surface,
					border: `1px solid ${C.border}`,
					borderRadius: 10,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
					padding: 4,
				}}
			>
				{qrDataUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={qrDataUrl} width={92} height={92} alt="QR" style={{ display: "flex" }} />
				) : (
					<span
						style={{
							fontSize: 7,
							color: C.inkMuted,
							textAlign: "center",
							wordBreak: "break-all",
							lineHeight: 1.3,
						}}
					>
						{shortUrl}
					</span>
				)}
			</div>
			<span style={{ fontSize: 10, color: C.inkMuted, letterSpacing: 0.5 }}>{BRAND.ctaScan}</span>
		</div>
	);
}

/**
 * Franja inferior del Sello Talacha.
 * Insertar como último hijo del contenedor raíz de cada ImageResponse.
 */
export function Watermark({ deepLink, qrDataUrl, leagueName, orgLogoUrl }: WatermarkProps) {
	const displayUrl = deepLink.replace(/^https?:\/\//, "").replace(/\?.*$/, "");

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				background: C.surface,
				borderTop: `2px solid ${C.brand}`,
				padding: "24px 56px",
				gap: 24,
			}}
		>
			{/* Identidad de marca + liga */}
			<div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
				{/* Wordmark */}
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<BrandDot />
					<span style={{ fontSize: 16, fontWeight: 800, color: C.brand, letterSpacing: 3 }}>
						{BRAND.wordmark}
					</span>
				</div>

				{/* Co-branding de la liga */}
				{leagueName && (
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						{orgLogoUrl && (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={orgLogoUrl}
								width={20}
								height={20}
								alt=""
								style={{ borderRadius: 4, display: "flex" }}
							/>
						)}
						<span style={{ fontSize: 13, color: C.inkDim }}>{leagueName}</span>
					</div>
				)}

				{/* Deep-link legible */}
				<span style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>{displayUrl}</span>

				{/* Tagline */}
				<span style={{ fontSize: 11, color: C.inkMuted, fontStyle: "italic" }}>
					{BRAND.tagline}
				</span>
			</div>

			{/* QR escaneable */}
			<QrBlock qrDataUrl={qrDataUrl} deepLink={deepLink} />
		</div>
	);
}
