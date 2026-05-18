"use client";

import type { VenueWithStats } from "@/entities/venue";

type Props = {
	venues: VenueWithStats[];
	onEdit: (v: VenueWithStats) => void;
	onDelete: (v: VenueWithStats) => void;
};

export function VenueListView({ venues, onEdit, onDelete }: Props) {
	return (
		<div className="bg-surface border border-line rounded-xl overflow-hidden">
			<table className="w-full text-[13px]">
				<thead>
					<tr className="border-b border-line">
						{["Color", "Nombre", "Dirección", "Cap.", "Ligas", "Ventanas", "Estado", ""].map(
							(h) => (
								<th
									key={h}
									className="px-3 py-2.5 text-left text-[10.5px] font-semibold tracking-[0.12em] uppercase text-ink-3"
								>
									{h}
								</th>
							),
						)}
					</tr>
				</thead>
				<tbody>
					{venues.map((v) => (
						<tr
							key={v.id}
							className="border-b border-line last:border-0 hover:bg-surface-2 transition"
						>
							<td className="px-3 py-3">
								<div className="w-4 h-4 rounded" style={{ background: v.color }} />
							</td>
							<td className="px-3 py-3 font-semibold text-ink">{v.name}</td>
							<td className="px-3 py-3 text-ink-2 max-w-[180px] truncate">
								{v.address ?? v.city ?? "—"}
							</td>
							<td className="px-3 py-3 text-ink-2">{v.capacity}</td>
							<td className="px-3 py-3 font-mono text-ink">{v.ligasCount}</td>
							<td className="px-3 py-3 font-mono text-ink">{v.totalWindows}</td>
							<td className="px-3 py-3">
								{v.ligasCount > 0 ? (
									<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
										En uso
									</span>
								) : (
									<span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface border border-line text-ink-3">
										Sin asignar
									</span>
								)}
							</td>
							<td className="px-3 py-3">
								<div className="flex items-center gap-1">
									<button
										onClick={() => onEdit(v)}
										className="px-2 py-1 text-[11.5px] text-ink-2 hover:text-ink hover:bg-surface rounded-md transition"
									>
										Editar
									</button>
									<button
										onClick={() => onDelete(v)}
										className="px-2 py-1 text-[11.5px] text-red-400 hover:bg-red-500/10 rounded-md transition"
									>
										Eliminar
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
