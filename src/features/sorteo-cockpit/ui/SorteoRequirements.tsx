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
import { Stack, Inline, Center } from "@/shared/ui/layout";
import { MIN_TEAMS_FOR_MATCHDAY } from "../constants";

type Props = {
	leagueId: string;
	teamsCount: number;
	hasVenue: boolean;
};

export function SorteoRequirements({ leagueId, teamsCount, hasVenue }: Props) {
	const hasEnoughTeams = teamsCount >= MIN_TEAMS_FOR_MATCHDAY;

	return (
		<Stack align="center" gap="lg" className="h-full justify-center px-5">
			<div className="text-center">
				<Center
					className="mx-auto mb-3.5 h-[52px] w-[52px] rounded-2xl"
					style={{ background: "rgba(0,230,118,0.1)" }}
				>
					<ClipboardList size={24} strokeWidth={2} color="var(--color-brand)" />
				</Center>
				<div
					className="mb-1.5"
					style={{
						fontFamily: "var(--font-display)",
						fontSize: 20,
						fontWeight: 800,
						color: "var(--color-ink)",
					}}
				>
					Antes de generar la jornada
				</div>
				<div style={{ fontSize: 13, color: "var(--color-ink-2)", maxWidth: 360 }}>
					Completa estos requisitos para poder sortear partidos.
				</div>
			</div>

			<Stack gap="sm" className="w-full max-w-[420px]">
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
			</Stack>
		</Stack>
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
		<Inline
			align="center"
			gap="md"
			className="surface-card px-4 py-3.5"
			style={{
				border: done ? undefined : "1px solid rgba(0,230,118,0.25)",
				background: done ? undefined : "rgba(0,230,118,0.04)",
			}}
		>
			<Center
				className="h-9 w-9 shrink-0 rounded-[10px]"
				style={{ background: done ? "var(--color-surface-2)" : "rgba(0,230,118,0.1)" }}
			>
				<Icon
					size={17}
					strokeWidth={2}
					color={done ? "var(--color-ink-3)" : "var(--color-brand)"}
				/>
			</Center>

			<div className="min-w-0 flex-1 text-left">
				<Inline align="center" gap="xs">
					{done ? (
						<CheckCircle2 size={13} strokeWidth={2.5} color="var(--color-brand)" />
					) : (
						<Circle size={13} strokeWidth={2.5} color="var(--color-ink-3)" />
					)}
					<span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-ink)" }}>
						{title}
					</span>
				</Inline>
				<div className="mt-0.5" style={{ fontSize: 11.5, color: "var(--color-ink-3)" }}>
					{done ? doneHint : description}
				</div>
			</div>

			{!done && (
				<Link
					href={href}
					className="inline-flex h-[34px] shrink-0 items-center rounded-lg px-3.5 no-underline"
					style={{
						fontSize: 12.5,
						fontWeight: 700,
						background: "var(--color-brand)",
						color: "var(--color-pitch)",
					}}
				>
					{cta}
				</Link>
			)}
		</Inline>
	);
}
