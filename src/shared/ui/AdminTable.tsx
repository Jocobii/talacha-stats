"use client";

/**
 * shared/ui/AdminTable.tsx
 *
 * Tabla administrativa genérica powered by TanStack Table v8.
 * - Sorting client-side dentro de la página actual (click en header)
 * - Paginación server-side via URL params (Link components, no estado)
 * - Columnas configurables con render personalizado
 * - Compatible con Server Components como padre (solo este componente es Client)
 */

import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	flexRender,
	type ColumnDef,
	type SortingState,
} from "@tanstack/react-table";

// Re-exportar helpers/tipos que viven en un archivo sin "use client"
// para que los importadores de AdminTable sigan funcionando igual.
export type { AdminTablePagination } from "./admin-table.helpers";
export { DEFAULT_PAGE_SIZE, buildPagination } from "./admin-table.helpers";
import type { AdminTablePagination } from "./admin-table.helpers";

// ── Tipos públicos ────────────────────────────────────────────────────────────

export type AdminTableColumn<T> = {
	key: string;
	label: string;
	hiddenMobile?: boolean;
	align?: "left" | "center" | "right";
	/** Si se omite, muestra row[key] como string */
	render?: (row: T) => ReactNode;
	/** Desactiva el sorting en esta columna. Default: true */
	sortable?: boolean;
};

export type AdminTableProps<T> = {
	columns: AdminTableColumn<T>[];
	rows: T[];
	getKey: (row: T) => string;
	actions?: (row: T) => ReactNode;
	pagination?: AdminTablePagination;
	emptyMessage?: string;
	countLabel?: string;
};

// Metadatos que pasamos por TanStack para usarlos en header/cell
type ColMeta = Pick<AdminTableColumn<unknown>, "hiddenMobile" | "align">;

declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
	interface ColumnMeta<TData, TValue> extends ColMeta {}
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AdminTable<T>({
	columns,
	rows,
	getKey,
	actions,
	pagination,
	emptyMessage = "No hay registros.",
	countLabel,
}: AdminTableProps<T>) {
	const [sorting, setSorting] = useState<SortingState>([]);

	// Convertir AdminTableColumn → ColumnDef de TanStack
	const tanstackCols = useMemo<ColumnDef<T>[]>(() => {
		const defs: ColumnDef<T>[] = columns.map((col) => ({
			id: col.key,
			header: col.label,
			// accessorFn permite sorting aunque el cell tenga render custom
			accessorFn: (row) => (row as Record<string, unknown>)[col.key],
			cell: col.render
				? ({ row }) => col.render!(row.original)
				: ({ getValue }) => {
						const v = getValue();
						return v != null ? String(v) : "—";
					},
			enableSorting: col.sortable !== false,
			meta: { hiddenMobile: col.hiddenMobile, align: col.align },
		}));

		if (actions) {
			defs.push({
				id: "__actions",
				header: "Acciones",
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-2">{actions(row.original)}</div>
				),
				enableSorting: false,
				meta: { align: "right" },
			});
		}

		return defs;
	}, [columns, actions]);

	const table = useReactTable({
		data: rows,
		columns: tanstackCols,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getRowId: getKey,
	});

	return (
		<div className="bg-surface rounded-xl shadow overflow-hidden">
			{countLabel && (
				<div className="px-4 py-3 border-b border-line">
					<p className="text-sm font-medium text-ink">{countLabel}</p>
				</div>
			)}

			{rows.length === 0 ? (
				<div className="px-4 py-10 text-center text-sm text-ink-3">{emptyMessage}</div>
			) : (
				<>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-surface-2 text-xs uppercase text-ink-2 whitespace-nowrap">
								{table.getHeaderGroups().map((hg) => (
									<tr key={hg.id}>
										{hg.headers.map((header) => {
											const meta = header.column.columnDef.meta as ColMeta | undefined;
											const sorted = header.column.getIsSorted();
											const canSort = header.column.getCanSort();
											return (
												<th
													key={header.id}
													className={[
														"px-4 py-2.5 font-semibold select-none",
														meta?.align === "center"
															? "text-center"
															: meta?.align === "right"
																? "text-right"
																: "text-left",
														meta?.hiddenMobile ? "hidden sm:table-cell" : "",
														canSort ? "cursor-pointer hover:text-ink transition-colors" : "",
													]
														.filter(Boolean)
														.join(" ")}
													onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
													title={canSort ? "Ordenar" : undefined}
												>
													<span className="inline-flex items-center gap-1">
														{header.isPlaceholder
															? null
															: flexRender(header.column.columnDef.header, header.getContext())}
														{canSort && (
															<span className="text-[10px] opacity-50 ml-0.5">
																{sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
															</span>
														)}
													</span>
												</th>
											);
										})}
									</tr>
								))}
							</thead>

							<tbody className="divide-y divide-line">
								{table.getRowModel().rows.map((row) => (
									<tr key={row.id} className="hover:bg-surface-2 transition-colors">
										{row.getVisibleCells().map((cell) => {
											const meta = cell.column.columnDef.meta as ColMeta | undefined;
											return (
												<td
													key={cell.id}
													className={[
														"px-4 py-3",
														meta?.align === "center"
															? "text-center"
															: meta?.align === "right"
																? "text-right"
																: "",
														meta?.hiddenMobile ? "hidden sm:table-cell" : "",
													]
														.filter(Boolean)
														.join(" ")}
												>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{pagination && <TablePagination {...pagination} />}
				</>
			)}
		</div>
	);
}

// ── Paginación server-side (Links, no estado) ─────────────────────────────────

function TablePagination({
	page,
	pageSize,
	total,
	baseHref,
	pageParam = "page",
	extraParams = {},
}: AdminTablePagination) {
	const totalPages = Math.ceil(total / pageSize);
	if (totalPages <= 1) return null;

	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	function href(p: number) {
		const params = new URLSearchParams({ ...extraParams, [pageParam]: String(p) });
		return `${baseHref}?${params.toString()}`;
	}

	const delta = 2;
	const range: number[] = [];
	for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
		range.push(i);
	}

	const btnBase = "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition";
	const btnActive = `${btnBase} bg-brand text-white border-brand`;
	const btnDefault = `${btnBase} text-ink-2 hover:bg-surface-2 border-line`;
	const btnDisabled = `${btnBase} text-ink-3 opacity-40 border-line cursor-not-allowed pointer-events-none`;

	return (
		<div className="px-4 py-3 border-t border-line flex items-center justify-between gap-4 flex-wrap">
			<p className="text-xs text-ink-3">
				{from}–{to} de {total}
			</p>

			<div className="flex items-center gap-1">
				{page > 1 ? (
					<Link href={href(page - 1)} className={btnDefault}>
						← Ant.
					</Link>
				) : (
					<span className={btnDisabled}>← Ant.</span>
				)}

				{range[0] > 1 && (
					<>
						<Link href={href(1)} className={btnDefault}>
							1
						</Link>
						{range[0] > 2 && <span className="px-1 text-xs text-ink-3">…</span>}
					</>
				)}

				{range.map((p) => (
					<Link key={p} href={href(p)} className={p === page ? btnActive : btnDefault}>
						{p}
					</Link>
				))}

				{range[range.length - 1] < totalPages && (
					<>
						{range[range.length - 1] < totalPages - 1 && (
							<span className="px-1 text-xs text-ink-3">…</span>
						)}
						<Link href={href(totalPages)} className={btnDefault}>
							{totalPages}
						</Link>
					</>
				)}

				{page < totalPages ? (
					<Link href={href(page + 1)} className={btnDefault}>
						Sig. →
					</Link>
				) : (
					<span className={btnDisabled}>Sig. →</span>
				)}
			</div>
		</div>
	);
}
