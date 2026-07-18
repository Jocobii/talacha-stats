"use client";

/**
 * features/sorteo-cockpit/ui/SorteoRequirements.tsx
 *
 * Se muestra en vez de CreateMatchdayForm cuando a la liga le falta cancha/
 * horario o no llega al mínimo de equipos (MIN_TEAMS_FOR_MATCHDAY) — no se
 * puede generar una jornada sin esto. Mismo criterio de checklist que
 * LeagueEmptyState (posiciones), pero con el idioma visual propio del cockpit
 * (CSS vars + "surface-card", sin Tailwind — ver CockpitPage/ContextPanel).
 */

import type { ComponentType } from "react";
import Link from "next/link";
import { MapPin, Users, CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { MIN_TEAMS_FOR_MATCHDAY } from "../constants";

type Props = {
	leagueId: string;
	teamsCount: number;
	hasVenue: boolean;
};

export function SorteoRequirements({ leagueId, teamsCount, hasVenue }: Props) {
	const hasEnoughTeams = teamsCount >= MIN_TEAMS_FOR_MATCHDAY;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
				gap: 20,
				padding: "0 20px",
			}}
		>
			<div style={{ textAlign: "center" }}>
				<div
					style={{
						width: 52,
						height: 52,
						borderRadius: 16,
						background: "rgba(0,230,118,0.1)",
						display: "grid",
						placeItems: "center",
						margin: "0 auto 14px",
					}}
				>
					<ClipboardList size={24} strokeWidth={2} color="var(--color-brand)" />
				</div>
				<div
					style={{
						fontFamily: "var(--font-display)",
						fontSize: 20,
						fontWeight: 800,
						color: "var(--color-ink)",
						marginBottom: 6,
					}}
				>
					Antes de generar la jornada
				</div>
				<div style={{ fontSize: 13, color: "var(--color-ink-2)", maxWidth: 360 }}>
					Completa estos requisitos para poder sortear partidos.
				</div>
			</div>

			<div
				style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 420 }}
			>
				<RequirementRow
					icon={MapPin}
					done={hasVenue}
					title="Cancha y horario"
					doneHint="Cancha y horario asignados."
					description="Asigna dónde y a qué hora se juega esta liga."
					href={`/admin/leagues/${leagueId}/canchas`}
					cta="Configurar cancha"
				/>
				<RequirementRow
					icon={Users}
					done={hasEnoughTeams}
					title={`Mínimo ${MIN_TEAMS_FOR_MATCHDAY} equipos`}
					doneHint={`${teamsCount} equipo${teamsCount === 1 ? "" : "s"} registrado${teamsCount === 1 ? "" : "s"}.`}
					description={`Tienes ${teamsCount} de ${MIN_TEAMS_FOR_MATCHDAY} equipos necesarios para sortear.`}
					href="/admin/teams"
					cta="Ir a Equipos"
				/>
			</div>
		</div>
	);
}

type RequirementRowProps = {
	icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
	done: boolean;
	title: string;
	description: string;
	doneHint: string;
	href: string;
	cta: string;
};

function RequirementRow({
	icon: Icon,
	done,
	title,
	description,
	doneHint,
	href,
	cta,
}: RequirementRowProps) {
	return (
		<div
			className="surface-card"
			style={{
				display: "flex",
				alignItems: "center",
				gap: 14,
				padding: "14px 16px",
				border: done ? undefined : "1px solid rgba(0,230,118,0.25)",
				background: done ? undefined : "rgba(0,230,118,0.04)",
			}}
		>
			<div
				style={{
					width: 36,
					height: 36,
					borderRadius: 10,
					display: "grid",
					placeItems: "center",
					flexShrink: 0,
					background: done ? "var(--color-surface-2)" : "rgba(0,230,118,0.1)",
				}}
			>
				<Icon
					size={17}
					strokeWidth={2}
					color={done ? "var(--color-ink-3)" : "var(--color-brand)"}
				/>
			</div>

			<div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
					{done ? (
						<CheckCircle2 size={13} strokeWidth={2.5} color="var(--color-brand)" />
					) : (
						<Circle size={13} strokeWidth={2.5} color="var(--color-ink-3)" />
					)}
					<span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-ink)" }}>
						{title}
					</span>
				</div>
				<div style={{ fontSize: 11.5, color: "var(--color-ink-3)", marginTop: 2 }}>
					{done ? doneHint : description}
				</div>
			</div>

			{!done && (
				<Link
					href={href}
					style={{
						flexShrink: 0,
						display: "inline-flex",
						alignItems: "center",
						height: 34,
						padding: "0 14px",
						fontSize: 12.5,
						fontWeight: 700,
						borderRadius: 8,
						background: "var(--color-brand)",
						color: "var(--color-pitch)",
						textDecoration: "none",
					}}
				>
					{cta}
				</Link>
			)}
		</div>
	);
}
