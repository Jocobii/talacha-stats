/**
 * app/(shell)/admin/leagues/leaguesColumns.tsx
 *
 * Definición de columnas de AdminTable para la vista de Ligas — separado de
 * LeaguesView.tsx para mantener ambos archivos cortos (AGENTS.md §3.5).
 * Espejo de app/admin/teams/teamsColumns.tsx.
 */

import { Badge } from "@/shared/ui/Badge";
import type { AdminTableColumn } from "@/shared/ui/AdminTable";
import type { LeagueRow } from "./LeaguesView";

const DAY_LABELS: Record<string, string> = {
	lunes: "Lunes",
	martes: "Martes",
	miercoles: "Miércoles",
	jueves: "Jueves",
	viernes: "Viernes",
	sabado: "Sábado",
	domingo: "Domingo",
};

function LeagueCell({ league }: { league: LeagueRow }) {
	return (
		<div className="min-w-0">
			{league.organization && (
				<p className="text-xs text-ink-3 mb-0.5 truncate">{league.organization.name}</p>
			)}
			<p className="font-display text-[17px] font-bold text-ink truncate leading-tight">
				{league.name}
			</p>
		</div>
	);
}

export const LEAGUE_COLUMNS: AdminTableColumn<LeagueRow>[] = [
	{
		key: "name",
		label: "Liga",
		render: (l) => <LeagueCell league={l} />,
	},
	{
		key: "dayOfWeek",
		label: "Día",
		hiddenMobile: true,
		render: (l) => <span className="text-ink-2">{DAY_LABELS[l.dayOfWeek] ?? l.dayOfWeek}</span>,
	},
	{
		key: "season",
		label: "Temporada",
		hiddenMobile: true,
		render: (l) => <span className="text-ink-2">{l.season}</span>,
	},
	{
		key: "teams",
		label: "Equipos",
		align: "center",
		render: (l) => <Badge tone="neutral">{(l.teams as unknown[])?.length ?? 0}</Badge>,
	},
	{
		key: "status",
		label: "Estado",
		render: (l) =>
			l.status === "finished" ? (
				<Badge tone="neutral">Terminada</Badge>
			) : (
				<Badge tone="brand">Activa</Badge>
			),
	},
];
