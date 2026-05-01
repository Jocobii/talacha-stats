/**
 * GET /api/content/jornada-image?leagueId=uuid&jornada=N&type=standings|goleadores|both
 *
 * Imagen vertical 1080x1920 para compartir en WhatsApp/Stories.
 * type=goleadores -> solo goleadores
 * type=standings  -> solo tabla
 * omitido/both    -> ambas secciones
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { db, leagues, playerSeasonStats, teamStandingsSnapshot } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { generateJornadaPills } from "@/features/post-import-content";
import { titleCase } from "@/shared/lib/normalize";

export const runtime = "nodejs";

const C = {
	bg: "#0a0f0d",
	surface: "#111814",
	surfaceAlt: "#162019",
	brand: "#00e676",
	ink: "#f0f4f2",
	inkDim: "#8a9e93",
	inkMuted: "#4a5e53",
	gold: "#fbbf24",
	silver: "#9ca3af",
	bronze: "#b45309",
	border: "#1e2b23",
} as const;

const W = 1080;
const H = 1920;

type Scorer = {
	player: { id: string; fullName: string; alias: string | null };
	team: { name: string } | null;
	goals: number;
};

type Standing = {
	teamId: string;
	team: { name: string };
	played: number;
	wins: number;
	draws: number;
	losses: number;
	points: number;
	goalsFor: number;
	goalsAgainst: number;
};

function pName(p: { fullName: string; alias: string | null }): string {
	return p.alias ? `"${titleCase(p.alias)}"` : titleCase(p.fullName);
}

function rankColor(i: number): string {
	return i === 0 ? C.gold : i === 1 ? C.silver : i === 2 ? C.bronze : C.inkDim;
}

function SectionTitle({ label }: { label: string }) {
	return (
		<span
			style={{ fontSize: 15, fontWeight: 700, color: C.brand, letterSpacing: 4, marginBottom: 28 }}
		>
			{label}
		</span>
	);
}

function ScorerRow({ s, i }: { s: Scorer; i: number }) {
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
					color: rankColor(i),
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
					{pName(s.player)}
				</span>
				<span style={{ fontSize: 16, color: C.inkDim, marginTop: 2 }}>
					{titleCase(s.team?.name ?? "")}
				</span>
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

function StandingRow({ s, i, compact }: { s: Standing; i: number; compact?: boolean }) {
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
					color: rankColor(i),
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
				{compact ? titleCase(s.team.name).split(" ")[0] : titleCase(s.team.name)}
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

const StatsHead = ({ compact }: { compact?: boolean }) => (
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

	const [league, rawScorers, rawStandings, pills] = await Promise.all([
		db.query.leagues.findFirst({
			where: eq(leagues.id, leagueId),
			columns: { id: true, name: true, season: true },
		}),
		needsScorers
			? db.query.playerSeasonStats.findMany({
					where: and(eq(playerSeasonStats.leagueId, leagueId)),
					with: {
						player: { columns: { id: true, fullName: true, alias: true } },
						team: { columns: { name: true } },
					},
					orderBy: [desc(playerSeasonStats.goals)],
					limit: type === "both" ? 5 : 8,
				})
			: ([] as Scorer[]),
		needsStandings
			? db.query.teamStandingsSnapshot
					.findMany({
						where: eq(teamStandingsSnapshot.leagueId, leagueId),
						with: { team: { columns: { name: true } } },
						orderBy: [desc(teamStandingsSnapshot.jornada), desc(teamStandingsSnapshot.points)],
					})
					.then((snaps) => {
						if (!snaps.length) return [] as Standing[];
						const latest = snaps[0].jornada;
						return snaps
							.filter((s) => s.jornada === latest)
							.sort(
								(a, b) =>
									b.points - a.points ||
									b.goalsFor - a.goalsFor - (b.goalsAgainst - a.goalsAgainst),
							)
							.slice(0, type === "both" ? 6 : 12) as Standing[];
					})
			: ([] as Standing[]),
		generateJornadaPills(leagueId, jornada),
	]);

	if (!league) return new Response("Liga no encontrada", { status: 404 });

	const leagueName = titleCase(league.name);
	const highlights = pills.filter((p) => p.priority <= 3).slice(0, 2);
	const scorers = (rawScorers as Scorer[]).filter((s) => s.goals > 0);
	const standings = rawStandings as Standing[];

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
					<SectionTitle label="GOLEADORES DEL TORNEO" />
					{scorers.length === 0 ? (
						<span style={{ fontSize: 22, color: C.inkMuted }}>Sin datos aun</span>
					) : (
						scorers.map((s, i) => <ScorerRow key={s.player.id} s={s} i={i} />)
					)}
				</div>
			)}
			{type === "standings" && (
				<div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "48px 72px" }}>
					<SectionTitle label="TABLA DE POSICIONES" />
					<StatsHead />
					{standings.length === 0 ? (
						<span style={{ fontSize: 22, color: C.inkMuted }}>Sin datos aun</span>
					) : (
						standings.map((s, i) => <StandingRow key={s.teamId} s={s} i={i} />)
					)}
				</div>
			)}
			{type === "both" && (
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					<div
						style={{ display: "flex", flexDirection: "column", flex: 1, padding: "40px 72px 28px" }}
					>
						<SectionTitle label="GOLEADORES" />
						{scorers.length === 0 ? (
							<span style={{ fontSize: 18, color: C.inkMuted }}>Sin datos aun</span>
						) : (
							scorers.map((s, i) => <ScorerRow key={s.player.id} s={s} i={i} />)
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
						<SectionTitle label="TABLA" />
						<StatsHead compact />
						{standings.length === 0 ? (
							<span style={{ fontSize: 18, color: C.inkMuted }}>Sin datos aun</span>
						) : (
							standings.map((s, i) => <StandingRow key={s.teamId} s={s} i={i} compact />)
						)}
					</div>
				</div>
			)}

			{/* Footer */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					background: C.surface,
					borderTop: `1px solid ${C.border}`,
					padding: "32px 72px",
				}}
			>
				{highlights.length > 0 && (
					<div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
						{highlights.map((pill, i) => (
							<div
								key={i}
								style={{
									display: "flex",
									flexDirection: "column",
									background: C.surfaceAlt,
									borderRadius: 16,
									padding: "18px 24px",
									border: `1px solid ${C.border}`,
									marginBottom: 12,
								}}
							>
								<span style={{ fontSize: 20, fontWeight: 700, color: C.brand }}>
									{pill.headline}
								</span>
								<span style={{ fontSize: 15, color: C.inkDim, marginTop: 4 }}>{pill.detail}</span>
							</div>
						))}
					</div>
				)}
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<span style={{ fontSize: 18, color: C.inkMuted }}>talachastats.com</span>
					<span style={{ fontSize: 14, color: C.inkMuted, letterSpacing: 2 }}>
						FUTBOL AMATEUR - TIJUANA
					</span>
				</div>
			</div>
		</div>,
		{
			width: W,
			height: H,
			headers: {
				"Content-Disposition": `attachment; filename="jornada-${jornada}-${type}-${league.name.replace(/\s+/g, "-").toLowerCase()}.png"`,
			},
		},
	);
}
