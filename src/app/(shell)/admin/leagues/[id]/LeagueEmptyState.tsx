import type { ComponentType } from "react";
import Link from "next/link";
import { MapPin, Users, CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/**
 * Se muestra cuando la liga no tiene standings, goleadores ni partidos.
 * El módulo de liga ya no ofrece el wizard de equipos/jugadores (decisión
 * Jocobi, jul 2026) — esa responsabilidad vive en el módulo de Equipos, que
 * pregunta a qué liga pertenece al crear cada equipo.
 *
 * En vez de un solo CTA, se muestra un checklist de arranque: cancha/horario
 * y equipos son los dos requisitos para que la liga pueda operar (sorteo,
 * jornadas). El estado de cada paso lo resuelve la page (server), este
 * componente es puramente presentacional.
 */

type Props = {
	leagueId: string;
	hasVenue: boolean;
	teamsCount: number;
};

export default function LeagueEmptyState({ leagueId, hasVenue, teamsCount }: Props) {
	const hasTeams = teamsCount > 0;
	const pendingCount = Number(!hasVenue) + Number(!hasTeams);

	return (
		<div className="py-10 px-6">
			<div className="text-center mb-7">
				<div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
					<ClipboardList size={26} strokeWidth={2} className="text-brand-ink" />
				</div>
				<h3 className="text-lg font-bold text-ink">Tu liga aún no tiene datos</h3>
				<p className="text-sm text-ink-2 mt-1 max-w-sm mx-auto">
					{pendingCount > 0
						? "Completa estos pasos para poder arrancar la liga (sorteo y jornadas)."
						: "Ya tienes lo necesario — genera el sorteo desde el tab Sorteo cuando quieras."}
				</p>
			</div>

			<div className="max-w-lg mx-auto flex flex-col gap-3">
				<ChecklistItem
					icon={MapPin}
					done={hasVenue}
					title="Cancha y horario"
					description="Asigna dónde y a qué hora se juega esta liga."
					doneHint="Cancha y horario asignados."
					href={`/admin/leagues/${leagueId}/canchas`}
					cta="Configurar cancha"
				/>
				<ChecklistItem
					icon={Users}
					done={hasTeams}
					title="Equipos"
					description="Crea los equipos que van a participar; los jugadores se registran ahí con su CURP."
					doneHint={`${teamsCount} equipo${teamsCount === 1 ? "" : "s"} registrado${teamsCount === 1 ? "" : "s"}.`}
					href="/admin/teams"
					cta="Ir a Equipos"
				/>
			</div>
		</div>
	);
}

type ChecklistItemProps = {
	icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
	done: boolean;
	title: string;
	description: string;
	doneHint: string;
	href: string;
	cta: string;
};

function ChecklistItem({
	icon: Icon,
	done,
	title,
	description,
	doneHint,
	href,
	cta,
}: ChecklistItemProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition",
				done ? "border-line bg-surface-2/40" : "border-brand/25 bg-brand/[0.04]",
			)}
		>
			<div
				className={cn(
					"w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
					done ? "bg-surface-2 text-ink-3" : "bg-brand/10 text-brand-ink",
				)}
			>
				<Icon size={17} strokeWidth={2} />
			</div>

			<div className="flex-1 min-w-0 text-left">
				<div className="flex items-center gap-1.5">
					{done ? (
						<CheckCircle2 size={13} strokeWidth={2.5} className="text-brand-ink shrink-0" />
					) : (
						<Circle size={13} strokeWidth={2.5} className="text-ink-3 shrink-0" />
					)}
					<p className="text-[13.5px] font-semibold text-ink">{title}</p>
				</div>
				<p className="text-xs text-ink-3 mt-0.5">{done ? doneHint : description}</p>
			</div>

			{!done && (
				<Link
					href={href}
					className="shrink-0 inline-flex items-center h-9 px-4 text-[13px] font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition"
				>
					{cta}
				</Link>
			)}
		</div>
	);
}
