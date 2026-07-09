"use client";

/**
 * app/admin/teams/TeamsTable.tsx
 *
 * Client Component wrapper para la lista de equipos.
 * - Vista principal: AdminTable con link "Ver" a detalle de equipo
 * - Vista secundaria: panel de fusión de duplicados (colapsable)
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/shared/api/client";
import { Plus } from "lucide-react";
import { AdminTable } from "@/shared/ui/AdminTable";
import type { AdminTableColumn, AdminTablePagination } from "@/shared/ui/AdminTable";
import { CreateTeamModal } from "@/features/team-management";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TeamRow = {
	id: string;
	name: string;
	leagueId: string;
	playerCount: number;
};

// ── Normalización y detección de duplicados ───────────────────────────────────

function normTeam(name: string) {
	return name
		.toUpperCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/\s+/g, " ")
		.replace(/[^A-Z0-9 ]/g, "")
		.trim();
}

function similarity(a: string, b: string): number {
	const na = normTeam(a),
		nb = normTeam(b);
	if (na === nb) return 1;
	if (na.includes(nb) || nb.includes(na)) return 0.85;
	let shared = 0;
	for (let i = 0; i < Math.min(na.length, nb.length); i++) {
		if (na[i] === nb[i]) shared++;
		else break;
	}
	return shared / Math.max(na.length, nb.length);
}

function detectDuplicateGroups(teams: TeamRow[]): TeamRow[][] {
	const visited = new Set<string>();
	const groups: TeamRow[][] = [];
	for (let i = 0; i < teams.length; i++) {
		if (visited.has(teams[i].id)) continue;
		const group = [teams[i]];
		for (let j = i + 1; j < teams.length; j++) {
			if (visited.has(teams[j].id)) continue;
			if (similarity(teams[i].name, teams[j].name) >= 0.8) {
				group.push(teams[j]);
				visited.add(teams[j].id);
			}
		}
		if (group.length > 1) {
			visited.add(teams[i].id);
			groups.push(group);
		}
	}
	return groups;
}

// ── Columnas de la tabla principal ────────────────────────────────────────────

function buildColumns(duplicateIds: Set<string>): AdminTableColumn<TeamRow>[] {
	return [
		{
			key: "name",
			label: "Equipo",
			render: (t) => (
				<div className="flex items-center gap-2">
					{duplicateIds.has(t.id) && (
						<span
							className="w-2 h-2 rounded-full bg-yellow-500 shrink-0"
							title="Posible duplicado"
						/>
					)}
					<span className="font-medium text-ink">{t.name}</span>
				</div>
			),
		},
		{
			key: "playerCount",
			label: "Jugadores",
			align: "center",
			hiddenMobile: true,
			render: (t) => <span className="text-ink-2 tabular-nums">{t.playerCount}</span>,
		},
	];
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
	rows: TeamRow[];
	pagination?: AdminTablePagination;
	leagueId: string; // para reload tras fusión y creación
	leagueName: string; // para mostrar en el modal de creación
	emptyMessage: string;
};

// ── Componente ────────────────────────────────────────────────────────────────

export function TeamsTable({ rows, pagination, leagueId, leagueName, emptyMessage }: Props) {
	const [mergeOpen, setMergeOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);

	const duplicateGroups = useMemo(() => detectDuplicateGroups(rows), [rows]);
	const duplicateIds = useMemo(
		() => new Set(duplicateGroups.flat().map((t) => t.id)),
		[duplicateGroups],
	);

	const columns = useMemo(() => buildColumns(duplicateIds), [duplicateIds]);

	function handleCreateSuccess() {
		setCreateOpen(false);
		window.location.href = `/admin/teams?leagueId=${leagueId}`;
	}

	return (
		<div className="space-y-4">
			{/* Modal de creación */}
			{createOpen && (
				<CreateTeamModal
					leagueId={leagueId}
					leagueName={leagueName}
					onSuccess={handleCreateSuccess}
					onClose={() => setCreateOpen(false)}
				/>
			)}

			{/* Toolbar: botón de nuevo equipo */}
			<div className="flex justify-end">
				<button
					onClick={() => setCreateOpen(true)}
					className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand/90 transition"
				>
					<Plus size={15} strokeWidth={2.5} />
					Nuevo equipo
				</button>
			</div>

			{/* Aviso de duplicados detectados */}
			{duplicateGroups.length > 0 && (
				<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
					<p className="text-sm text-yellow-300">
						⚠ {duplicateGroups.length} grupo{duplicateGroups.length !== 1 ? "s" : ""} de posibles
						duplicados detectados
					</p>
					<button
						onClick={() => setMergeOpen((v) => !v)}
						className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-yellow-600/50 text-yellow-300 hover:bg-yellow-900/40 font-medium transition"
					>
						{mergeOpen ? "Ocultar fusión" : "Gestionar duplicados"}
					</button>
				</div>
			)}

			{/* Panel de fusión (secundario, colapsable) */}
			{mergeOpen && (
				<MergePanel
					teams={rows}
					leagueId={leagueId}
					duplicateGroups={duplicateGroups}
					onClose={() => setMergeOpen(false)}
				/>
			)}

			{/* Tabla principal */}
			<AdminTable
				columns={columns}
				rows={rows}
				getKey={(t) => t.id}
				actions={(t) => (
					<Link
						href={`/admin/teams/${t.id}`}
						className="text-xs px-2.5 py-1 rounded-lg border border-brand/30 text-brand-ink hover:bg-brand/10 font-medium transition"
					>
						Ver
					</Link>
				)}
				pagination={pagination}
				emptyMessage={emptyMessage}
				countLabel={`${rows.length} equipo${rows.length !== 1 ? "s" : ""}`}
			/>
		</div>
	);
}

// ── Panel de fusión ───────────────────────────────────────────────────────────

function MergePanel({
	teams,
	leagueId,
	duplicateGroups,
	onClose,
}: {
	teams: TeamRow[];
	leagueId: string;
	duplicateGroups: TeamRow[][];
	onClose: () => void;
}) {
	const [keepId, setKeepId] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [merging, setMerging] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [confirmOpen, setConfirmOpen] = useState(false);

	function toggleSelect(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
		if (keepId === id) setKeepId("");
		setError("");
	}

	function handleSetKeep(id: string) {
		setKeepId(id);
		setSelected((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	}

	async function handleMerge() {
		if (!keepId || selected.size === 0) {
			setError("Elige un equipo a conservar y al menos un duplicado a eliminar.");
			return;
		}
		setMerging(true);
		setError("");
		try {
			const result = await apiFetch<{ merged: number }>("/api/teams/merge", {
				method: "POST",
				body: { keepId, mergeIds: [...selected] },
			});
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setSuccess(
				`Fusión completada: ${result.data.merged} equipo(s) eliminado(s). ` +
					`Partidos, eventos y estadísticas reasignados.`,
			);
			setConfirmOpen(false);
			setKeepId("");
			setSelected(new Set());
			// Refrescar la página para que el Server Component recargue los datos
			window.location.href = `/admin/teams?leagueId=${leagueId}`;
		} catch (networkError) {
			console.error("[TeamsTable] merge", networkError);
			setError("Error de red. Intenta de nuevo.");
		} finally {
			setMerging(false);
		}
	}

	const canMerge = keepId && selected.size > 0;
	const keepTeam = teams.find((t) => t.id === keepId);
	const allCandidates = duplicateGroups.flat();

	return (
		<div className="bg-surface rounded-xl shadow border border-yellow-800/30 overflow-hidden">
			<div className="px-4 py-3 border-b border-line flex items-center justify-between">
				<p className="text-sm font-semibold text-ink">Fusionar duplicados</p>
				<button onClick={onClose} className="text-xs text-ink-3 hover:text-ink transition">
					✕ Cerrar
				</button>
			</div>

			<div className="p-4 space-y-3">
				{/* Instrucciones */}
				<div className="bg-blue-950/40 border border-blue-800/50 rounded-lg px-3 py-2 text-xs text-blue-300 space-y-0.5">
					<p className="font-semibold">Cómo fusionar:</p>
					<p>
						1. Haz clic en <strong>Conservar</strong> en el equipo que quieres mantener.
					</p>
					<p>
						2. Haz clic en <strong>Eliminar</strong> en los duplicados que sobran.
					</p>
					<p>
						3. Presiona <strong>Fusionar</strong>.
					</p>
				</div>

				{/* Grupos detectados */}
				<div className="space-y-1">
					{duplicateGroups.map((group, i) => (
						<p key={i} className="text-xs text-yellow-300">
							Grupo {i + 1}: {group.map((t) => t.name).join(" · ")}
						</p>
					))}
				</div>

				{/* Tabla de candidatos */}
				<div className="rounded-lg border border-line overflow-hidden text-sm">
					{allCandidates.map((team) => {
						const isKeep = keepId === team.id;
						const isSelected = selected.has(team.id);
						return (
							<div
								key={team.id}
								className={[
									"flex items-center justify-between px-3 py-2 border-b border-line last:border-0",
									isKeep ? "bg-brand/10" : isSelected ? "bg-red-950/40" : "bg-surface",
								].join(" ")}
							>
								<span
									className={`font-medium ${isKeep ? "text-brand-ink" : isSelected ? "text-red-400 line-through" : "text-ink"}`}
								>
									{isKeep && <span className="text-xs mr-1.5">✓</span>}
									{isSelected && <span className="text-xs mr-1.5">✕</span>}
									{team.name}
								</span>
								<div className="flex gap-1.5">
									{!isKeep && (
										<button
											onClick={() => handleSetKeep(team.id)}
											disabled={isSelected}
											className="text-xs px-2 py-1 rounded border border-brand/30 text-brand-ink hover:bg-brand/10 disabled:opacity-30 transition"
										>
											Conservar
										</button>
									)}
									{isKeep && (
										<button
											onClick={() => setKeepId("")}
											className="text-xs px-2 py-1 rounded border border-line text-ink-2 hover:bg-surface-2 transition"
										>
											Desmarcar
										</button>
									)}
									{!isSelected && !isKeep && (
										<button
											onClick={() => toggleSelect(team.id)}
											className="text-xs px-2 py-1 rounded border border-red-300/30 text-red-400 hover:bg-red-950/40 transition"
										>
											Eliminar
										</button>
									)}
									{isSelected && (
										<button
											onClick={() => toggleSelect(team.id)}
											className="text-xs px-2 py-1 rounded border border-line text-ink-2 hover:bg-surface-2 transition"
										>
											Desmarcar
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Error / éxito */}
				{error && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{error}
					</p>
				)}
				{success && (
					<p className="text-xs text-brand-ink bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
						✓ {success}
					</p>
				)}

				{canMerge && (
					<button
						onClick={() => setConfirmOpen(true)}
						className="w-full bg-red-600 text-white text-sm py-2 rounded-lg font-semibold hover:bg-red-700 transition"
					>
						Fusionar seleccionados ({selected.size})
					</button>
				)}
			</div>

			{/* Modal de confirmación */}
			{confirmOpen && keepTeam && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
					<div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
						<h2 className="font-bold text-ink text-lg">Confirmar fusión</h2>
						<div className="bg-brand/10 border border-brand/20 rounded-lg p-3 text-sm">
							<p className="text-brand-ink font-semibold">Se conservará:</p>
							<p className="text-brand-ink font-bold mt-0.5">📌 {keepTeam.name}</p>
						</div>
						<div className="bg-red-950/40 border border-red-800/50 rounded-lg p-3 text-sm">
							<p className="text-red-400 font-semibold">Se eliminarán:</p>
							<ul className="mt-0.5 space-y-0.5">
								{[...selected].map((id) => {
									const t = teams.find((x) => x.id === id);
									return t ? (
										<li key={id} className="text-red-400 font-medium">
											✕ {t.name}
										</li>
									) : null;
								})}
							</ul>
						</div>
						<p className="text-xs text-ink-2">
							Todos los partidos, eventos, estadísticas y registros se reasignarán a{" "}
							<strong>{keepTeam.name}</strong>. Esta acción no se puede deshacer.
						</p>
						<div className="flex gap-3 pt-1">
							<button
								onClick={() => setConfirmOpen(false)}
								className="flex-1 bg-surface-2 text-ink py-2.5 rounded-lg text-sm font-medium hover:bg-surface-2"
							>
								Cancelar
							</button>
							<button
								onClick={handleMerge}
								disabled={merging}
								className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50"
							>
								{merging ? "Fusionando…" : "Sí, fusionar"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
