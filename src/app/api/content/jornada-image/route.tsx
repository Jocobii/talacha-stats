/**
 * GET /api/content/jornada-image?leagueId=uuid&jornada=N&type=standings|goleadores|both
 *
 * Imagen vertical 1080×1920 para compartir en WhatsApp/Stories.
 * Fuente de goleadores:
 *   Prioridad 1 — playerSeasonStats (Excel/V1) si existen datos.
 *   Prioridad 2 — match_player_stats (captura V2) como fallback.
 *
 * Footer: Sello Talacha con deep-link + QR (Regla C1 del contrato de marca).
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { db, leagues, playerSeasonStats, organizations } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { getLeagueStandings } from "@/lib/standings";
import type { TeamStanding } from "@/types";
import { generateJornadaPills } from "@/features/post-import-content";
import { titleCase } from "@/shared/lib/normalize";
import { getLeagueTopScorersV2 } from "@/entities/match-player-stat";
import { getOrgImagePalette } from "@/features/org-theming";
import type { ImagePalette } from "@/shared/org-theme";
import { Watermark } from "@/shared/brand/Watermark";
import { buildQrDataUrl } from "@/shared/brand/qr";
import { buildDeepLink } from "@/features/share-assets/deep-link";

export const runtime = "nodejs";

const W = 1080;
const H = 1920;

// ── Tipos internos ──────────────────────────────────────────────────────────

type ScorerRow = {
	id: string;
	name: string;
	teamName: string;
	goals: number;
};

type Standing = TeamStanding;

// ── Helpers de render ───────────────────────────────────────────────────────

// La paleta llega por props (puede ser la de la org) — nada de módulo global.

function rankColor(i: number, C: ImagePalette): string {
	return i === 0 ? C.gold : i === 1 ? C.silver : i === 2 ? C.bronze : C.inkDim;
}

function SectionTitle({ label, C }: { label: string; C: ImagePalette }) {
	return (
		<span
			style={{ fontSize: 15, fontWeight: 700, color: C.brand, letterSpacing: 4, marginBottom: 28 }}
		>
			{label}
		</span>
	);
}

function ScorerRow({ s, i, C }: { s: ScorerRow; i: number; C: ImagePalette }) {
	const medals = ["🥇", "🥈", "🥉"];
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				background: i === 0 ? C.surfaceAlt : "transparent",
				borderRadius: 16,
				padding: i === 0 ? "20px 24px" : "12px 24px",
				border: i === 0 ? `1px solid ${C.border}` : "none",
				marginBottom: i === 0 ? 12 : 4,
			}}
		>
			<span
				style={{
					fontSize: i < 3 ? 30 : 20,
					fontWeight: 900,
					color: rankColor(i, C),
					width: 52,
					textAlign: "center",
					flexShrink: 0,
				}}
			>
				{i < 3 ? medals[i] : String(i + 1)}
			</span>
			<div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 16 }}>
				<span
					style={{
						fontSize: i === 0 ? 30 : 24,
						fontWeight: i === 0 ? 800 : 600,
						color: C.ink,
						lineHeight: "1.1",
					}}
				>
					{s.name}
				</span>
				<span style={{ fontSize: 16, color: C.inkDim, marginTop: 2 }}>{titleCase(s.teamName)}</span>
			</div>
			<div style={{ display: "flex", alignItems: "baseline" }}>
				<span
					style={{
						fontSize: i === 0 ? 50 : 36,
						fontWeight: 900,
						color: i === 0 ? C.brand : C.ink,
						lineHeight: "1",
					}}
				>
					{s.goals}
				</span>
				<span style={{ fontSize: 20, color: C.inkDim, marginLeft: 6 }}>goles</span>
			</div>
		</div>
	);
}

function StandingRow({
	s,
	i,
	compact,
	C,
}: {
	s: Standing;
	i: number;
	compact?: boolean;
	C: ImagePalette;
}) {
	const fs = compact ? (i === 0 ? 20 : 17) : i === 0 ? 24 : 20;
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				background: i === 0 ? C.surfaceAlt : "transparent",
				borderRadius: 14,
				padding: i === 0 ? (compact ? "12px 8px" : "16px 8px") : compact ? "7px 8px" : "10px 8px",
				border: i === 0 ? `1px solid ${C.border}` : "none",
				marginBottom: i === 0 ? (compact ? 6 : 10) : 2,
			}}
		>
			<span
				style={{
					fontSize: compact ? 16 : 18,
					fontWeight: 900,
					color: rankColor(i, C),
					width: compact ? 40 : 44,
					flexShrink: 0,
					textAlign: "center",
				}}
			>
				{i + 1}
			</span>
			<span
				style={{
					flex: 2,
					fontSize: fs,
					fontWeight: i === 0 ? 800 : 500,
					color: C.ink,
					paddingRight: 8,
				}}
			>
				{compact ? titleCase(s.teamName).split(" ")[0] : titleCase(s.teamName)}
			</span>
			{[s.played, s.wins, s.draws, s.losses].map((val, j) => (
				<span
					key={j}
					style={{ flex: 1, fontSize: compact ? 15 : fs, color: C.inkDim, textAlign: "center" }}
				>
					{val}
				</span>
			))}
			<span
				style={{
					flex: 1,
					fontSize: compact ? (i === 0 ? 21 : 17) : i === 0 ? 26 : 20,
					fontWeight: 900,
					color: i === 0 ? C.brand : C.ink,
					textAlign: "center",
				}}
			>
				{s.points}
			</span>
		</div>
	);
}

const StatsHead = ({ compact, C }: { compact?: boolean; C: ImagePalette }) => (
	<div
		style={{
			display: "flex",
			paddingLeft: compact ? 60 : 68,
			paddingRight: 8,
			marginBottom: compact ? 6 : 8,
		}}
	>
		{["PJ", "G", "E", "P", "PTS"].map((h) => (
			<span
				key={h}
				style={{
					flex: 1,
					fontSize: compact ? 12 : 13,
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
);

// ── Handler principal ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const leagueId = searchParams.get("leagueId");
	const jornadaRaw = searchParams.get("jornada");
	const type = (searchParams.get("type") ?? "both") as "goleadores" | "standings" | "both";

	if (!leagueId || !jornadaRaw) {
		return new Response("Faltan parametros: leagueId y jornada", { status: 400 });
	}
	const jornada = Number(jornadaRaw);
	if (isNaN(jornada) || jornada < 1) {
		return new Response("jornada debe ser un numero mayor a 0", { status: 400 });
	}

	const needsScorers = type !== "standings";
	const needsStandings = type !== "goleadores";

	// Cargar datos en paralelo — liga con su org para el deep-link
	// getLeagueStandings maneja prioridad V1 (snapshot Excel) → V2 (partidos capturados)
	const [league, allStandings, pills] = await Promise.all([
		db.query.leagues.findFirst({
			where: eq(leagues.id, leagueId),
			columns: { id: true, name: true, season: true, slug: true, organizationId: true },
		}),
		needsStandings ? getLeagueStandings(leagueId) : ([] as Standing[]),
		generateJornadaPills(leagueId, jornada),
	]);

	if (!league) return new Response("Liga no encontrada", { status: 404 });

	// Paleta de la org (o BRAND_PALETTE si no tiene tema)
	const C = await getOrgImagePalette(league.organizationId);

	// Limitar filas según el tipo de asset (la imagen tiene altura fija)
	const standings = allStandings.slice(0, type === "both" ? 8 : 20);

	// Goleadores: prioridad V1 (Excel), fallback V2 (match_player_stats)
	let scorers: ScorerRow[] = [];
	if (needsScorers) {
		const limit = type === "both" ? 5 : 8;
		const v1rows = await db.query.playerSeasonStats.findMany({
			where: and(eq(playerSeasonStats.leagueId, leagueId)),
			with: {
				playerProfile: { columns: { id: true, fullName: true, alias: true } },
				team: { columns: { name: true } },
			},
			orderBy: [desc(playerSeasonStats.goals)],
			limit,
		});

		if (v1rows.length > 0) {
			scorers = v1rows
				.filter((r) => r.goals > 0)
				.map((r) => ({
					id: r?.playerProfile?.id,
					name: r?.playerProfile?.alias
						? `"${titleCase(r.playerProfile.alias)}"`
						: titleCase(r?.playerProfile?.fullName ?? "Jugador sin nombre"),
					teamName: r?.team?.name ?? "",
					goals: r.goals,
				})) as ScorerRow[];
		} else {
			const v2rows = await getLeagueTopScorersV2(leagueId, limit);
			scorers = v2rows.map((r) => ({
				id: r.inscriptionId,
				name: titleCase(r.fullName),
				teamName: r.teamName,
				goals: r.goals,
			}));
		}
	}

	// Deep-link + QR para el Sello Talacha
	let deepLink = `https://talachastats.com`;
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
				assetType:
					type === "standings" ? "standings" : type === "goleadores" ? "goleadores" : "combo",
			});
			orgLogoUrl = org.logoUrl ?? undefined;
		}
	}

	const qrDataUrl = await buildQrDataUrl(deepLink);
	const leagueName = titleCase(league.name);
	const highlights = pills.filter((p) => p.priority <= 3).slice(0, 2);

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
					padding: "56px 72px 44px",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
					<div
						style={{
							width: 18,
							height: 18,
							borderRadius: 9,
							background: C.brand,
							display: "flex",
							marginRight: 12,
						}}
					/>
					<span style={{ fontSize: 17, fontWeight: 700, color: C.brand, letterSpacing: 4 }}>
						TALACHASTATS
					</span>
				</div>
				<div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span
							style={{
								fontSize: leagueName.length > 18 ? 56 : 68,
								fontWeight: 900,
								color: C.ink,
								lineHeight: "1",
								letterSpacing: -2,
							}}
						>
							{leagueName}
						</span>
						<span style={{ fontSize: 24, color: C.inkDim, marginTop: 4 }}>{league.season}</span>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							background: C.brand,
							borderRadius: 20,
							padding: "14px 32px",
						}}
					>
						<span style={{ fontSize: 14, fontWeight: 700, color: C.bg, letterSpacing: 3 }}>
							JORNADA
						</span>
						<span style={{ fontSize: 60, fontWeight: 900, color: C.bg, lineHeight: "1" }}>
							{jornada}
						</span>
					</div>
				</div>
			</div>

			{/* Content */}
			{type === "goleadores" && (
				<div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "48px 72px" }}>
					<SectionTitle label="GOLEADORES DEL TORNEO" C={C} />
					{scorers.length === 0 ? (
						<span style={{ fontSize: 22, color: C.inkMuted }}>Sin datos aún</span>
					) : (
						scorers.map((s, i) => <ScorerRow key={s.id} s={s} i={i} C={C} />)
					)}
				</div>
			)}
			{type === "standings" && (
				<div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "48px 72px" }}>
					<SectionTitle label="TABLA DE POSICIONES" C={C} />
					<StatsHead C={C} />
					{standings.length === 0 ? (
						<span style={{ fontSize: 22, color: C.inkMuted }}>Sin datos aún</span>
					) : (
						standings.map((s, i) => <StandingRow key={s.teamId} s={s} i={i} C={C} />)
					)}
				</div>
			)}
			{type === "both" && (
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					<div
						style={{ display: "flex", flexDirection: "column", flex: 1, padding: "40px 72px 28px" }}
					>
						<SectionTitle label="GOLEADORES" C={C} />
						{scorers.length === 0 ? (
							<span style={{ fontSize: 18, color: C.inkMuted }}>Sin datos aún</span>
						) : (
							scorers.map((s, i) => <ScorerRow key={s.id} s={s} i={i} C={C} />)
						)}
					</div>
					<div
						style={{
							height: 1,
							background: C.border,
							marginLeft: 72,
							marginRight: 72,
							display: "flex",
						}}
					/>
					<div
						style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 72px 32px" }}
					>
						<SectionTitle label="TABLA" C={C} />
						<StatsHead compact C={C} />
						{standings.length === 0 ? (
							<span style={{ fontSize: 18, color: C.inkMuted }}>Sin datos aún</span>
						) : (
							standings.map((s, i) => <StandingRow key={s.teamId} s={s} i={i} compact C={C} />)
						)}
					</div>
				</div>
			)}

			{/* Highlights de jornada */}
			{highlights.length > 0 && (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						background: C.surface,
						borderTop: `1px solid ${C.border}`,
						padding: "20px 72px 12px",
					}}
				>
					{highlights.map((pill, i) => (
						<div
							key={i}
							style={{
								display: "flex",
								flexDirection: "column",
								background: C.surfaceAlt,
								borderRadius: 16,
								padding: "14px 20px",
								border: `1px solid ${C.border}`,
								marginBottom: 8,
							}}
						>
							<span style={{ fontSize: 18, fontWeight: 700, color: C.brand }}>{pill.headline}</span>
							<span style={{ fontSize: 13, color: C.inkDim, marginTop: 2 }}>{pill.detail}</span>
						</div>
					))}
				</div>
			)}
		</div>,
	);
}
