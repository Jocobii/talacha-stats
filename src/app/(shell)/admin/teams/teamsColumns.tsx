/**
 * app/admin/teams/teamsColumns.tsx
 *
 * Definición de columnas de AdminTable para equipos — separado de
 * TeamsTable.tsx para mantener ambos archivos por debajo del límite de
 * tamaño (AGENTS.md §3.5). Solo config declarativa, sin lógica de componente.
 * Espejo de app/admin/players/playersColumns.tsx.
 */

import { Badge } from "@/shared/ui/Badge";
import { Avatar } from "@/shared/ui/Avatar";
import type { AdminTableColumn } from "@/shared/ui/AdminTable";
import type { OrgTeamRow, GlobalTeamRow } from "@/entities/team";

function initials(name: string): string {
	return name
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();
}

function TeamCell({ name }: { name: string }) {
	return (
		<div className="flex items-center gap-2.5">
			<Avatar initials={initials(name)} size="sm" />
			<span className="font-medium text-ink">{name}</span>
		</div>
	);
}

export const ORG_TEAM_COLUMNS: AdminTableColumn<OrgTeamRow>[] = [
	{
		key: "name",
		label: "Equipo",
		sortField: "nombre",
		render: (t) => <TeamCell name={t.name} />,
	},
	{
		key: "status",
		label: "Estado",
		render: (t) =>
			t.status === "disbanded" ? (
				<Badge tone="danger">Disuelto</Badge>
			) : (
				<Badge tone="brand">Activo</Badge>
			),
	},
	{
		key: "playerCount",
		label: "Jugadores",
		align: "right",
		render: (t) => <Badge tone="neutral">{t.playerCount}</Badge>,
	},
];

export const OWNER_TEAM_COLUMNS: AdminTableColumn<GlobalTeamRow>[] = [
	{
		key: "name",
		label: "Equipo",
		render: (t) => <TeamCell name={t.name} />,
	},
	{
		key: "leagueName",
		label: "Liga",
		hiddenMobile: true,
		render: (t) => <span className="text-ink-2 text-sm">{t.leagueName}</span>,
	},
	{
		key: "playerCount",
		label: "Jugadores",
		align: "right",
		render: (t) => <Badge tone="neutral">{t.playerCount}</Badge>,
	},
];
