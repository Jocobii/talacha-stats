/**
 * GET /api/content/standings-image?leagueId=uuid
 *
 * Imagen 1080×1350 (feed estándar) de la tabla de posiciones.
 * Sin footer — header compacto + tabla que llena toda la imagen.
 * Muestra todos los equipos: altura de fila calculada dinámicamente.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { db, leagues, organizations } from "@/db";
import { eq } from "drizzle-orm";
import { getLeagueStandings } from "@/lib/standings";
import { titleCase } from "@/shared/lib/normalize";
import { BRAND_PALETTE as C } from "@/shared/brand/palette";
import { BRAND } from "@/shared/brand/tokens";
import { buildDeepLink } from "@/features/share-assets/deep-link";
import type { TeamStanding } from "@/types";

export const runtime = "nodejs";

// ── Dimensiones ────────────────────────────────────────────────────────────────
const W = 1080;
const H = 1350;

// ── Constantes de layout ───────────────────────────────────────────────────────
const HEADER_H = 68;
const COL_LABEL_H = 28;
const TABLE_PAD_T = 16;
const TABLE_PAD_B = 16;
const COL_MB = 4;

// Píxeles disponibles para todas las filas de equipos
const ROWS_BUDGET = H - HEADER_H - TABLE_PAD_T - TABLE_PAD_B - COL_LABEL_H - COL_MB;

function rowHeight(teamCount: number): number {
	if (teamCount === 0) return 40;
	return Math.max(26, Math.min(60, ROWS_BUDGET / teamCount));
}

function rankColor(i: number): string {
	return i === 0 ? C.gold : i === 1 ? C.silver : i === 2 ? C.bronze : C.inkDim;
}

// Ancho fijo del número de posición — debe ser idéntico en header y filas
const RANK_W = 36;

type RowProps = { s: TeamStanding; i: number; rh: number };

function StandingRow({ s, i, rh }: RowProps) {
	const isTop = i === 0;
	const fs = Math.max(13, Math.min(20, Math.round(rh * 0.37)));
	const fsPts = isTop ? Math.min(fs + 5, 24) : fs;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				height: rh,
				background: isTop ? C.surfaceAlt : i % 2 === 0 ? "transparent" : "#0d1510",
				borderRadius: isTop ? 10 : 0,
				border: isTop ? `1px solid ${C.border}` : "none",
				paddingLeft: 4,
				paddingRight: 4,
				marginBottom: isTop ? 2 : 0,
				flexShrink: 0,
			}}
		>
			{/* Posición */}
			<span
				style={{
					width: RANK_W,
					flexShrink: 0,
					fontSize: Math.max(12, fs - 1),
					fontWeight: 900,
					color: rankColor(i),
					textAlign: "center",
				}}
			>
				{i + 1}
			</span>

			{/* Nombre del equipo */}
			<span
				style={{
					flex: 3,
					fontSize: fs,
					fontWeight: isTop ? 800 : 500,
					color: C.ink,
					paddingRight: 8,
					overflow: "hidden",
					whiteSpace: "nowrap",
				}}
			>
				{titleCase(s.teamName)}
			</span>

			{/* PJ G E P */}
			{[s.played, s.wins, s.draws, s.losses].map((val, j) => (
				<span
					key={j}
					style={{
						flex: 1,
						fontSize: Math.max(12, fs - 1),
						color: C.inkDim,
						textAlign: "center",
					}}
				>
					{val}
				</span>
			))}

			{/* PTS */}
			<span
				style={{
					flex: 1,
					fontSize: fsPts,
					fontWeight: 900,
					color: isTop ? C.brand : C.ink,
					textAlign: "center",
				}}
			>
				{s.points}
			</span>
		</div>
	);
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const leagueId = searchParams.get("leagueId");
	if (!leagueId) return new Response("Falta leagueId", { status: 400 });

	const [league, standings] = await Promise.all([
		db.query.leagues.findFirst({
			where: eq(leagues.id, leagueId),
			columns: { id: true, name: true, season: true, slug: true, organizationId: true },
		}),
		getLeagueStandings(leagueId),
	]);

	if (!league) return new Response("Liga no encontrada", { status: 404 });

	let deepLink = `https://${BRAND.domain}`;

	if (league.slug && league.organizationId) {
		const org = await db.query.organizations.findFirst({
			where: eq(organizations.id, league.organizationId),
			columns: { slug: true },
		});
		if (org?.slug) {
			deepLink = buildDeepLink({
				orgSlug: org.slug,
				leagueSlug: league.slug,
				assetType: "standings",
			});
		}
	}

	const leagueName = titleCase(league.name);
	const rh = rowHeight(standings.length);

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
			{/* ── Header: branding + info de liga ── */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					height: HEADER_H,
					flexShrink: 0,
					background: C.surface,
					borderBottom: `3px solid ${C.brand}`,
					paddingLeft: 48,
					paddingRight: 48,
				}}
			>
				{/* Izquierda: marca · liga · temporada */}
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div
						style={{
							width: 10,
							height: 10,
							borderRadius: 5,
							background: C.brand,
							display: "flex",
							flexShrink: 0,
						}}
					/>
					<span style={{ fontSize: 11, fontWeight: 800, color: C.brand, letterSpacing: 3 }}>
						{BRAND.wordmark}
					</span>
					<div
						style={{ width: 1, height: 22, background: C.border, display: "flex", flexShrink: 0 }}
					/>
					<span
						style={{
							fontSize: leagueName.length > 22 ? 20 : 24,
							fontWeight: 900,
							color: C.ink,
							letterSpacing: -0.5,
						}}
					>
						{leagueName}
					</span>
					<span style={{ fontSize: 13, color: C.inkDim }}>{league.season}</span>
				</div>

				{/* Derecha: badge */}
				<div
					style={{
						display: "flex",
						background: C.surfaceAlt,
						border: `1px solid ${C.border}`,
						borderRadius: 8,
						padding: "6px 14px",
					}}
				>
					<span style={{ fontSize: 11, fontWeight: 700, color: C.brand, letterSpacing: 3 }}>
						TABLA GENERAL
					</span>
				</div>
			</div>

			{/* ── Tabla ── */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					paddingTop: TABLE_PAD_T,
					paddingBottom: TABLE_PAD_B,
					paddingLeft: 44,
					paddingRight: 44,
					overflow: "hidden",
				}}
			>
				{/* Cabecera de columnas — misma estructura flex que las filas */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						height: COL_LABEL_H,
						marginBottom: COL_MB,
						paddingLeft: 4,
						paddingRight: 4,
						flexShrink: 0,
					}}
				>
					{/* Spacer: número de posición */}
					<span style={{ width: RANK_W, flexShrink: 0 }} />
					{/* Spacer: nombre del equipo */}
					<span style={{ flex: 3 }} />
					{/* Etiquetas de stats */}
					{["PJ", "G", "E", "P", "PTS"].map((h) => (
						<span
							key={h}
							style={{
								flex: 1,
								fontSize: 11,
								fontWeight: 700,
								color: C.inkMuted,
								textAlign: "center",
								letterSpacing: 2,
							}}
						>
							{h}
						</span>
					))}
				</div>

				{/* Filas */}
				{standings.length === 0 ? (
					<span style={{ fontSize: 18, color: C.inkMuted, marginTop: 16 }}>Sin datos aún</span>
				) : (
					standings.map((s, i) => <StandingRow key={s.teamId} s={s} i={i} rh={rh} />)
				)}
			</div>
		</div>,
		{
			width: W,
			height: H,
			headers: {
				"Content-Disposition": `attachment; filename="tabla-${league.name.replace(/\s+/g, "-").toLowerCase()}.png"`,
			},
		},
	);
}
