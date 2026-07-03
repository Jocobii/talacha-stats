/**
 * GET /api/content/scorers-image?leagueId=uuid&limit=10
 *
 * Imagen 1080×1350 de los goleadores actuales del torneo.
 * Fuente: V1 (playerSeasonStats Excel) → V2 (match_player_stats) como fallback.
 * No requiere número de jornada: siempre muestra el estado actual.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { db, leagues, playerSeasonStats, organizations } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { getLeagueTopScorersV2 } from "@/entities/match-player-stat";
import { titleCase } from "@/shared/lib/normalize";
import { getOrgImagePalette } from "@/features/org-theming";
import type { ImagePalette } from "@/shared/org-theme";
import { BRAND } from "@/shared/brand/tokens";
import { Watermark } from "@/shared/brand/Watermark";
import { buildQrDataUrl } from "@/shared/brand/qr";
import { buildDeepLink } from "@/features/share-assets/deep-link";

export const runtime = "nodejs";

const W = 1080;
const H = 1350;

type ScorerRow = { id: string; name: string; teamName: string; goals: number };

function rankColor(i: number, C: ImagePalette): string {
	return i === 0 ? C.gold : i === 1 ? C.silver : i === 2 ? C.bronze : C.inkDim;
}

// La paleta llega por props (puede ser la de la org) — nada de módulo global.
function ScorerItem({ s, i, C }: { s: ScorerRow; i: number; C: ImagePalette }) {
	const medals = ["🥇", "🥈", "🥉"];
	const isTop = i === 0;
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				background: isTop ? C.surfaceAlt : "transparent",
				borderRadius: isTop ? 16 : 0,
				padding: isTop ? "20px 24px" : "11px 24px",
				border: isTop ? `1px solid ${C.border}` : "none",
				marginBottom: isTop ? 10 : 2,
			}}
		>
			<span
				style={{
					fontSize: i < 3 ? 28 : 18,
					fontWeight: 900,
					color: rankColor(i, C),
					width: 52,
					textAlign: "center",
					flexShrink: 0,
				}}
			>
				{i < 3 ? medals[i] : String(i + 1)}
			</span>
			<div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 14 }}>
				<span
					style={{
						fontSize: isTop ? 32 : 24,
						fontWeight: isTop ? 800 : 600,
						color: C.ink,
						lineHeight: "1.1",
					}}
				>
					{s.name}
				</span>
				<span style={{ fontSize: 15, color: C.inkDim, marginTop: 2 }}>{titleCase(s.teamName)}</span>
			</div>
			<div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
				<span
					style={{
						fontSize: isTop ? 56 : 38,
						fontWeight: 900,
						color: isTop ? C.brand : C.ink,
						lineHeight: "1",
					}}
				>
					{s.goals}
				</span>
				<span style={{ fontSize: 18, color: C.inkDim }}>goles</span>
			</div>
		</div>
	);
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const leagueId = searchParams.get("leagueId");
	if (!leagueId) return new Response("Falta leagueId", { status: 400 });

	const limitParam = Math.min(parseInt(searchParams.get("limit") ?? "10"), 10);

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, name: true, season: true, slug: true, organizationId: true },
	});
	if (!league) return new Response("Liga no encontrada", { status: 404 });

	// Paleta de la org (o BRAND_PALETTE si no tiene tema)
	const C = await getOrgImagePalette(league.organizationId);

	// Goleadores: prioridad V1 (Excel), fallback V2 (partidos capturados)
	let scorers: ScorerRow[] = [];
	const v1rows = await db.query.playerSeasonStats.findMany({
		where: and(eq(playerSeasonStats.leagueId, leagueId)),
		with: {
			playerProfile: { columns: { id: true, fullName: true, alias: true } },
			team: { columns: { name: true } },
		},
		orderBy: [desc(playerSeasonStats.goals)],
		limit: limitParam,
	});

	if (v1rows.length > 0) {
		scorers = v1rows
			.filter((r) => r.goals > 0)
			.map((r) => ({
				id: r.playerProfile?.id ?? r.id,
				name: r.playerProfile?.alias
					? `"${titleCase(r.playerProfile.alias)}"`
					: titleCase(r.playerProfile?.fullName ?? "Jugador"),
				teamName: r.team?.name ?? "",
				goals: r.goals,
			}));
	} else {
		const v2rows = await getLeagueTopScorersV2(leagueId, limitParam);
		scorers = v2rows.map((r) => ({
			id: r.inscriptionId,
			name: titleCase(r.fullName),
			teamName: r.teamName,
			goals: r.goals,
		}));
	}

	let deepLink = `https://${BRAND.domain}`;
	let orgLogoUrl: string | undefined;

	if (league.slug && league.organizationId) {
		const org = await db.query.organizations.findFirst({
			where: eq(organizations.id, league.organizationId),
			columns: { slug: true, logoUrl: true },
		});
		if (org?.slug) {
			deepLink = buildDeepLink({
				orgSlug: org.slug,
				leagueSlug: league.slug,
				assetType: "goleadores",
			});
			orgLogoUrl = org.logoUrl ?? undefined;
		}
	}

	const qrDataUrl = await buildQrDataUrl(deepLink);
	const leagueName = titleCase(league.name);

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
			{/* Header */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					background: C.surface,
					borderBottom: `4px solid ${C.brand}`,
					padding: "44px 64px 36px",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
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
					<span style={{ fontSize: 14, fontWeight: 800, color: C.brand, letterSpacing: 4 }}>
						{BRAND.wordmark}
					</span>
				</div>
				<div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span
							style={{
								fontSize: leagueName.length > 18 ? 52 : 64,
								fontWeight: 900,
								color: C.ink,
								lineHeight: "1",
								letterSpacing: -2,
							}}
						>
							{leagueName}
						</span>
						<span style={{ fontSize: 20, color: C.inkDim, marginTop: 6 }}>{league.season}</span>
					</div>
					<div
						style={{
							display: "flex",
							background: C.surfaceAlt,
							border: `1px solid ${C.border}`,
							borderRadius: 12,
							padding: "10px 20px",
						}}
					>
						<span style={{ fontSize: 13, fontWeight: 700, color: C.brand, letterSpacing: 3 }}>
							GOLEO GENERAL
						</span>
					</div>
				</div>
			</div>

			{/* Lista de goleadores */}
			<div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 56px 16px" }}>
				{scorers.length === 0 ? (
					<span style={{ fontSize: 22, color: C.inkMuted, marginTop: 24 }}>Sin goleadores aún</span>
				) : (
					scorers.map((s, i) => <ScorerItem key={s.id} s={s} i={i} C={C} />)
				)}
			</div>

			{/* Sello Talacha */}
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
				"Content-Disposition": `attachment; filename="goleadores-${league.name.replace(/\s+/g, "-").toLowerCase()}.png"`,
			},
		},
	);
}
