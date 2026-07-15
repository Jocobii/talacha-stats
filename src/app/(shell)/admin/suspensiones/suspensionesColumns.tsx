/**
 * app/admin/suspensiones/suspensionesColumns.tsx
 *
 * Definición de columnas de AdminTable para suspensiones — separado de
 * SuspensionesTable.tsx para mantener ambos archivos por debajo del límite de
 * tamaño (AGENTS.md §3.5). Solo config declarativa, sin lógica de componente.
 * Espejo de app/admin/players/playersColumns.tsx; a diferencia de
 * jugadores/equipos, owner y organizador comparten el mismo shape de fila
 * (GlobalSuspensionListItemDto ya trae liga+equipo), así que hay un solo set
 * de columnas para ambas vistas — la única diferencia entre variantes es qué
 * filas llegan, no qué se pinta.
 */

import { AlertCircle, Ban, CheckCircle, Undo2 } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Avatar } from "@/shared/ui/Avatar";
import { cn } from "@/shared/lib/cn";
import type { AdminTableColumn } from "@/shared/ui/AdminTable";
import type { GlobalSuspensionListItemDto } from "@/entities/suspension";
import {
	fmtIsoDate,
	initialsFromName,
	weeksLeft,
} from "@/features/discipline/lib/format-suspension";

const ESTADO_TONE: Record<string, "warn" | "danger" | "neutral"> = {
	active: "warn",
	served: "neutral",
	lifted: "neutral",
};
const ESTADO_LABEL: Record<string, string> = {
	active: "Activa",
	served: "Cumplida",
	lifted: "Levantada",
};

function PlayerCell({ playerName }: { playerName: string }) {
	return (
		<div className="flex items-center gap-2.5">
			<Avatar initials={initialsFromName(playerName)} size="sm" />
			<span className="font-medium text-ink">{playerName}</span>
		</div>
	);
}

function MotivoCell({ s }: { s: GlobalSuspensionListItemDto }) {
	if (s.durationType === "permanent") {
		return (
			<Badge tone={s.status === "active" ? "danger" : "neutral"} icon={Ban}>
				{s.reason === "manual" ? "Veto manual" : "Veto"}
			</Badge>
		);
	}
	if (s.durationType === "time") {
		return (
			<Badge tone="warn" icon={AlertCircle}>
				{s.reason === "red_card" ? "Roja directa · escalada" : "Escalada"}
			</Badge>
		);
	}
	const label =
		s.reason === "red_card"
			? "Roja directa"
			: s.reason === "yellow_accumulation"
				? "Acumulación de amarillas"
				: "Manual";
	return <Badge tone="neutral">{label}</Badge>;
}

function EstadoCell({ s }: { s: GlobalSuspensionListItemDto }) {
	const icon = s.status === "served" ? CheckCircle : s.status === "lifted" ? Undo2 : undefined;
	return (
		<Badge tone={ESTADO_TONE[s.status] ?? "neutral"} icon={icon}>
			{ESTADO_LABEL[s.status] ?? s.status}
		</Badge>
	);
}

function DuracionCell({ s }: { s: GlobalSuspensionListItemDto }) {
	if (s.status !== "active") return <span className="text-ink-3 text-xs">—</span>;

	if (s.durationType === "permanent") {
		return <span className="text-[12.5px] font-semibold text-red-400">Indefinido</span>;
	}

	if (s.durationType === "time" && s.endsOn) {
		return (
			<div className="text-right">
				<div className="text-[13px] font-semibold text-amber-300">Hasta {fmtIsoDate(s.endsOn)}</div>
				<div className="text-[11.5px] text-ink-3 mt-0.5">
					faltan {weeksLeft(s.endsOn)} semana{weeksLeft(s.endsOn) !== 1 ? "s" : ""}
				</div>
			</div>
		);
	}

	const total = s.matchesTotal ?? 0;
	return (
		<div className="text-right">
			<div className="flex items-center gap-1 justify-end">
				{Array.from({ length: total }).map((_, i) => (
					<span
						key={i}
						className={cn(
							"w-1.5 h-1.5 rounded-full",
							i < s.matchesServed ? "bg-brand" : "bg-ink-3/40",
						)}
					/>
				))}
			</div>
			<div className="text-[11.5px] text-ink-3 mt-1">
				{s.matchesServed} de {total} fecha{total !== 1 ? "s" : ""}
			</div>
		</div>
	);
}

export const SUSPENSION_COLUMNS: AdminTableColumn<GlobalSuspensionListItemDto>[] = [
	{
		key: "playerName",
		label: "Jugador",
		sortField: "jugador",
		render: (s) => <PlayerCell playerName={s.playerName} />,
	},
	{
		key: "teamName",
		label: "Equipo",
		hiddenMobile: true,
		render: (s) => <span className="text-ink-2 text-sm">{s.teamName}</span>,
	},
	{
		key: "leagueName",
		label: "Liga",
		hiddenMobile: true,
		render: (s) => <span className="text-ink-2 text-sm">{s.leagueName}</span>,
	},
	{
		key: "reason",
		label: "Motivo",
		render: (s) => <MotivoCell s={s} />,
	},
	{
		key: "status",
		label: "Estado",
		render: (s) => <EstadoCell s={s} />,
	},
	{
		key: "duracion",
		label: "Duración",
		align: "right",
		render: (s) => <DuracionCell s={s} />,
	},
];
