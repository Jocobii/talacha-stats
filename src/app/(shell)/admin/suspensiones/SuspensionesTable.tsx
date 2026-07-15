"use client";

/**
 * app/admin/suspensiones/SuspensionesTable.tsx
 *
 * Client Component wrapper para AdminTable en la sección de suspensiones.
 * Las columnas de datos viven en suspensionesColumns.tsx (config declarativa,
 * separada para mantener este archivo corto — AGENTS.md §3.5); esta capa solo
 * agrega la columna de acciones (Escalar / Levantar), que necesita callbacks
 * — mismo criterio que "Escalar"/"Levantar" en SuspensionListParts.tsx, solo
 * que aquí vive dentro de una fila de AdminTable en vez de una tarjeta.
 *
 * La page (Server Component) nunca pasa esto directo: siempre a través de
 * OwnerSuspensionesView / OrgSuspensionesView, que reciben datos ya
 * serializables.
 */

import { ArrowUpCircle, Undo2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { AdminTable } from "@/shared/ui/AdminTable";
import type { AdminTablePagination, AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { GlobalSuspensionListItemDto } from "@/entities/suspension";
import { SUSPENSION_COLUMNS } from "./suspensionesColumns";

export type SuspensionesTableProps = {
	rows: GlobalSuspensionListItemDto[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
	sort?: AdminTableSortConfig;
	onEscalate: (s: GlobalSuspensionListItemDto) => void;
	onLift: (s: GlobalSuspensionListItemDto) => void;
};

function RowActions({
	s,
	onEscalate,
	onLift,
}: {
	s: GlobalSuspensionListItemDto;
	onEscalate: () => void;
	onLift: () => void;
}) {
	if (s.status !== "active") return null;
	if (s.durationType === "permanent") {
		return (
			<Button variant="secondary" size="sm" icon={Undo2} onClick={onLift}>
				Levantar
			</Button>
		);
	}
	return (
		<Button variant="ghost" size="sm" icon={ArrowUpCircle} onClick={onEscalate}>
			Escalar
		</Button>
	);
}

export function SuspensionesTable({
	rows,
	pagination,
	emptyMessage,
	countLabel,
	sort,
	onEscalate,
	onLift,
}: SuspensionesTableProps) {
	return (
		<AdminTable
			columns={SUSPENSION_COLUMNS}
			rows={rows}
			getKey={(r) => r.id}
			actions={(r) => (
				<RowActions s={r} onEscalate={() => onEscalate(r)} onLift={() => onLift(r)} />
			)}
			pagination={pagination}
			emptyMessage={emptyMessage}
			countLabel={countLabel}
			sort={sort}
		/>
	);
}
