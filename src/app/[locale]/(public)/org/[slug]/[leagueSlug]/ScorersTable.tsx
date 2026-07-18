"use client";

/**
 * app/(public)/org/[slug]/[leagueSlug]/ScorersTable.tsx
 *
 * Tabla de goleadores — mismo componente/arquitectura que las tablas admin
 * (AdminTable + paginación server-side vía Links, ver shared/ui/AdminTable.tsx
 * y el "molde" de /admin/leagues, /admin/players). Los datos ya vienen
 * paginados/ordenados desde `searchTopScorers` (entities/organization) — este
 * componente NUNCA filtra ni recorta en memoria, solo pinta la página actual.
 *
 * "use client" a propósito (mismo motivo que PlayersTable.tsx en
 * /admin/players): `columns` lleva funciones `render`/`getKey`, y una
 * función no se puede pasar de un Server Component a un Client Component
 * como prop — hay que construirlas del lado del cliente. El componente
 * padre (page.tsx) solo le pasa datos serializables (arrays, strings,
 * números).
 */

import { Link } from "@/shared/i18n/navigation";
import { AdminTable, buildPagination, type AdminTableColumn } from "@/shared/ui";
import { titleCase } from "@/shared/lib/normalize";
import type { TopScorerRow } from "@/entities/organization";

type Row = TopScorerRow & { rank: number };

type Props = {
	scorers: TopScorerRow[];
	page: number;
	pageSize: number;
	total: number;
	baseHref: string;
	extraParams: Record<string, string>;
	emptyMessage: string;
};

const columns: AdminTableColumn<Row>[] = [
	{
		key: "rank",
		label: "#",
		align: "center",
		render: (row) => <span className="font-display font-black text-ink-3">{row.rank}</span>,
	},
	{
		key: "fullName",
		label: "Jugador",
		render: (row) => {
			const displayName = row.alias ? `"${titleCase(row.alias)}"` : titleCase(row.fullName);
			return row.playerId ? (
				<Link
					href={`/player/${row.playerId}`}
					className="font-semibold text-ink hover:text-brand-ink"
				>
					{displayName}
				</Link>
			) : (
				<span className="font-semibold text-ink">{displayName}</span>
			);
		},
	},
	{
		key: "teamName",
		label: "Equipo",
		hiddenMobile: true,
		render: (row) => <span className="text-ink-2">{titleCase(row.teamName)}</span>,
	},
	{
		key: "matchesPlayed",
		label: "PJ",
		align: "center",
		hiddenMobile: true,
	},
	{
		key: "goals",
		label: "Goles",
		align: "center",
		render: (row) => <span className="font-display font-black text-brand-ink">{row.goals}</span>,
	},
	{
		key: "assists",
		label: "Asist.",
		align: "center",
		hiddenMobile: true,
	},
];

export default function ScorersTable({
	scorers,
	page,
	pageSize,
	total,
	baseHref,
	extraParams,
	emptyMessage,
}: Props) {
	const rows: Row[] = scorers.map((s, i) => ({ ...s, rank: (page - 1) * pageSize + i + 1 }));

	const pagination = buildPagination(page, total, baseHref, {
		pageSize,
		extraParams,
	});
	return (
		<AdminTable
			columns={columns}
			rows={rows}
			getKey={(row) => row.playerId ?? String(row.rank)}
			pagination={pagination}
			emptyMessage={emptyMessage}
		/>
	);
}
