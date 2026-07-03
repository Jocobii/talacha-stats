/**
 * GET /api/content/league-launch-image?leagueId=uuid
 *
 * Imagen 1080×1350 de lanzamiento de liga — se genera al crear la liga
 * (antes de capturar partidos). Contiene: nombre de liga, temporada, N equipos.
 * Sello Talacha con deep-link + QR (Regla C1).
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { db, leagues, teams, organizations } from "@/db";
import { eq, and } from "drizzle-orm";
import { titleCase } from "@/shared/lib/normalize";
import { getOrgImagePalette } from "@/features/org-theming";
import { BRAND } from "@/shared/brand/tokens";
import { buildQrDataUrl } from "@/shared/brand/qr";
import { buildDeepLink } from "@/features/share-assets/deep-link";
import { Watermark } from "@/shared/brand/Watermark";

export const runtime = "nodejs";

const W = 1080;
const H = 1350;

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const leagueId = searchParams.get("leagueId");
	if (!leagueId) return new Response("Falta leagueId", { status: 400 });

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, name: true, season: true, slug: true, organizationId: true },
	});
	if (!league) return new Response("Liga no encontrada", { status: 404 });

	// Paleta de la org (o BRAND_PALETTE si no tiene tema)
	const C = await getOrgImagePalette(league.organizationId);

	const [teamCount, org] = await Promise.all([
		db
			.select({ id: teams.id })
			.from(teams)
			.where(and(eq(teams.leagueId, leagueId), eq(teams.status, "active")))
			.then((rows) => rows.length),
		league.organizationId
			? db.query.organizations.findFirst({
					where: eq(organizations.id, league.organizationId),
					columns: { slug: true, logoUrl: true, name: true },
				})
			: null,
	]);

	const leagueName = titleCase(league.name);

	let deepLink = `https://${BRAND.domain}`;
	let orgLogoUrl: string | undefined;
	if (org?.slug && league.slug) {
		deepLink = buildDeepLink({
			orgSlug: org.slug,
			leagueSlug: league.slug,
			assetType: "league_launch",
		});
		orgLogoUrl = org.logoUrl ?? undefined;
	}

	const qrDataUrl = await buildQrDataUrl(deepLink);

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				background: C.bg,
				fontFamily: "sans-serif",
			}}
		>
			{/* Header con marca */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					background: C.surface,
					borderBottom: `4px solid ${C.brand}`,
					padding: "40px 72px",
					gap: 14,
				}}
			>
				<div
					style={{
						width: 16,
						height: 16,
						borderRadius: 8,
						background: C.brand,
						display: "flex",
						flexShrink: 0,
					}}
				/>
				<span style={{ fontSize: 15, fontWeight: 800, color: C.brand, letterSpacing: 4 }}>
					{BRAND.wordmark}
				</span>
				{org?.name && (
					<>
						<span style={{ fontSize: 14, color: C.border }}>·</span>
						<span style={{ fontSize: 13, color: C.inkDim }}>{titleCase(org.name)}</span>
					</>
				)}
			</div>

			{/* Contenido principal */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: "60px 80px",
					gap: 32,
				}}
			>
				{/* Etiqueta "NUEVA LIGA" */}
				<div
					style={{
						display: "flex",
						background: C.brand,
						borderRadius: 40,
						padding: "10px 28px",
					}}
				>
					<span style={{ fontSize: 13, fontWeight: 800, color: C.bg, letterSpacing: 5 }}>
						NUEVA LIGA
					</span>
				</div>

				{/* Nombre de la liga */}
				<span
					style={{
						fontSize: leagueName.length > 20 ? 72 : 88,
						fontWeight: 900,
						color: C.ink,
						lineHeight: "0.95",
						letterSpacing: -3,
						textAlign: "center",
					}}
				>
					{leagueName}
				</span>

				{/* Temporada */}
				<span style={{ fontSize: 28, color: C.inkDim }}>{league.season}</span>

				{/* Divisor */}
				<div
					style={{
						width: 80,
						height: 3,
						background: C.brand,
						borderRadius: 2,
						display: "flex",
					}}
				/>

				{/* Número de equipos */}
				{teamCount > 0 && (
					<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
						<span style={{ fontSize: 96, fontWeight: 900, color: C.brand, lineHeight: "1" }}>
							{teamCount}
						</span>
						<span style={{ fontSize: 22, color: C.inkDim, letterSpacing: 2 }}>EQUIPOS</span>
					</div>
				)}

				<span style={{ fontSize: 18, color: C.inkMuted, textAlign: "center", maxWidth: 560 }}>
					¡El torneo está listo. Síguenos para ver tabla y goleadores en tiempo real!
				</span>
			</div>

			{/* Sello Talacha — Regla C1 */}
			<Watermark
				deepLink={deepLink}
				qrDataUrl={qrDataUrl}
				leagueName={leagueName}
				orgLogoUrl={orgLogoUrl}
			/>
		</div>,
		{
			width: W,
			height: H,
			headers: {
				"Content-Disposition": `attachment; filename="lanzamiento-${league.name.replace(/\s+/g, "-").toLowerCase()}.png"`,
			},
		},
	);
}
