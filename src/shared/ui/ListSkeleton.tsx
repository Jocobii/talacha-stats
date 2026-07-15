/**
 * shared/ui/ListSkeleton.tsx
 *
 * Skeleton genérico para el molde "módulo data-heavy" (header + FilterBar +
 * tabla) — usado por loading.tsx de cualquier listado con filtros (jugadores,
 * equipos, …). No es específico de un módulo: la cantidad de controles de
 * filtro y de columnas se configuran por props.
 *
 * Server Component — no tiene estado ni interacción, Next.js lo puede
 * mostrar de inmediato mientras la page async resuelve sus queries.
 */

function Bar({ width, className = "" }: { width: string; className?: string }) {
	return (
		<div className={`h-3.5 rounded bg-surface-2 animate-pulse ${className}`} style={{ width }} />
	);
}

export function ListSkeleton({
	filterCount = 4,
	columns = 6,
	rows = 8,
	showActions = true,
}: {
	/** Nº de controles de filtro a simular en la fila del FilterBar. */
	filterCount?: number;
	/** Nº de columnas de la tabla a simular. */
	columns?: number;
	/** Nº de filas de la tabla a simular. */
	rows?: number;
	/** Si se muestra el botón de acción del header (ej. "+ Nuevo"). */
	showActions?: boolean;
}) {
	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-1 pb-6 border-b border-line">
				<div className="flex items-end justify-between gap-4">
					<div className="h-8 w-40 rounded bg-surface-2 animate-pulse" />
					{showActions && <div className="h-9 w-32 rounded-md bg-surface-2 animate-pulse" />}
				</div>
			</header>

			<div className="flex flex-wrap items-center gap-2.5">
				{Array.from({ length: filterCount }).map((_, i) => (
					<div key={i} className="h-9 w-full sm:w-[190px] rounded-md bg-surface-2 animate-pulse" />
				))}
			</div>

			<div className="bg-surface border border-line rounded-xl overflow-hidden">
				<div className="px-4 py-3 border-b border-line">
					<Bar width="140px" />
				</div>
				<table className="w-full text-sm">
					<tbody>
						{Array.from({ length: rows }).map((_, r) => (
							<tr key={r} className="border-t border-line">
								{Array.from({ length: columns }).map((__, c) => (
									<td key={c} className="px-4 py-3.5">
										<Bar width={c === 0 ? "70%" : `${40 + ((c * 13 + r * 7) % 35)}%`} />
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
