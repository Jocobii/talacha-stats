"use client";

import { useState, useEffect, useMemo } from "react";

type League = { id: string; name: string; season: string; dayOfWeek: string };
type Team = { id: string; name: string; leagueId: string };

// ── Normalización para detectar duplicados ────────────────────────────────
function normTeam(name: string) {
	return name
		.toUpperCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // sin acentos
		.replace(/\s+/g, " ")
		.replace(/[^A-Z0-9 ]/g, "") // solo alfanumérico
		.trim();
}

// Distancia de Levenshtein simplificada (para nombres cortos)
function similarity(a: string, b: string): number {
	const na = normTeam(a),
		nb = normTeam(b);
	if (na === nb) return 1;
	// containment parcial
	if (na.includes(nb) || nb.includes(na)) return 0.85;
	// prefijo compartido largo
	let shared = 0;
	for (let i = 0; i < Math.min(na.length, nb.length); i++) {
		if (na[i] === nb[i]) shared++;
		else break;
	}
	return shared / Math.max(na.length, nb.length);
}

// Agrupa equipos con nombres muy similares (umbral 0.8)
function detectDuplicateGroups(teams: Team[]): Team[][] {
	const visited = new Set<string>();
	const groups: Team[][] = [];

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

// ── Componente principal ──────────────────────────────────────────────────
export default function TeamsPage() {
	const [leagues, setLeagues] = useState<League[]>([]);
	const [leagueId, setLeagueId] = useState("");
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Estado de fusión
	const [keepId, setKeepId] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [merging, setMerging] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);

	useEffect(() => {
		fetch("/api/leagues")
			.then((r) => r.json())
			.then((d) => setLeagues(d.data ?? []));
	}, []);

	async function loadTeams(lid: string) {
		if (!lid) {
			setTeams([]);
			return;
		}
		setLoading(true);
		const res = await fetch(`/api/teams?league_id=${lid}`);
		const data = await res.json();
		setTeams(data.data ?? []);
		setLoading(false);
		setKeepId("");
		setSelected(new Set());
		setError("");
		setSuccess("");
	}

	function handleLeagueChange(lid: string) {
		setLeagueId(lid);
		loadTeams(lid);
	}

	const duplicateGroups = useMemo(() => detectDuplicateGroups(teams), [teams]);
	const duplicateIds = useMemo(
		() => new Set(duplicateGroups.flat().map((t) => t.id)),
		[duplicateGroups],
	);

	function toggleSelect(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
		// Si ya era el keepId, limpiarlo
		if (keepId === id) setKeepId("");
		setError("");
	}

	function handleSetKeep(id: string) {
		setKeepId(id);
		// Asegurarse que no esté en selected
		setSelected((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	}

	async function handleMerge() {
		if (!keepId || selected.size === 0) {
			setError("Debes elegir un equipo a conservar y al menos un duplicado a eliminar.");
			return;
		}
		setMerging(true);
		setError("");
		setSuccess("");
		try {
			const res = await fetch("/api/teams/merge", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ keepId, mergeIds: [...selected] }),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error);
				return;
			}
			setSuccess(
				`✅ Fusión completada: ${data.data.merged} equipo(s) eliminado(s). ` +
					`Se reasignaron partidos, eventos y estadísticas.`,
			);
			setConfirmOpen(false);
			setKeepId("");
			setSelected(new Set());
			await loadTeams(leagueId);
		} finally {
			setMerging(false);
		}
	}

	const canMerge = keepId && selected.size > 0;
	const keepTeam = teams.find((t) => t.id === keepId);

	return (
		<div className="max-w-3xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-ink">Gestionar equipos</h1>
				<p className="text-sm text-ink-2 mt-1">
					Detecta y fusiona equipos duplicados. Todos los datos (partidos, stats, posiciones) se
					reasignan automáticamente.
				</p>
			</div>

			{/* Selector de liga */}
			<div className="bg-surface rounded-xl shadow p-5">
				<label className="block text-sm font-medium text-ink mb-1">Liga</label>
				{leagues.length === 0 ? (
					<p className="text-sm text-yellow-600">No hay ligas registradas.</p>
				) : (
					<select
						value={leagueId}
						onChange={(e) => handleLeagueChange(e.target.value)}
						className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
					>
						<option value="">— Seleccionar liga —</option>
						{leagues.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name} · {l.season}
							</option>
						))}
					</select>
				)}
			</div>

			{/* Instrucciones */}
			{teams.length > 0 && (
				<div className="bg-blue-950/40 border border-blue-800/50 rounded-xl px-4 py-3 text-sm text-blue-300 space-y-1">
					<p className="font-semibold">Cómo fusionar duplicados:</p>
					<ol className="list-decimal list-inside space-y-0.5 text-blue-300">
						<li>
							Haz clic en <strong>Conservar</strong> en el equipo que quieres mantener.
						</li>
						<li>
							Haz clic en <strong>Eliminar</strong> en los duplicados que sobran.
						</li>
						<li>
							Presiona <strong>Fusionar seleccionados</strong>.
						</li>
					</ol>
				</div>
			)}

			{/* Mensajes */}
			{error && (
				<p className="bg-red-950/40 border border-red-800/50 text-red-400 text-sm px-4 py-2.5 rounded-xl">
					{error}
				</p>
			)}
			{success && (
				<p className="bg-brand/10 border border-brand/20 text-brand text-sm px-4 py-2.5 rounded-xl">
					{success}
				</p>
			)}

			{/* Lista de equipos */}
			{loading && <p className="text-sm text-ink-3">Cargando equipos…</p>}

			{teams.length > 0 && (
				<>
					{/* Grupos de duplicados detectados */}
					{duplicateGroups.length > 0 && (
						<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-xl p-4">
							<p className="text-sm font-semibold text-yellow-300 mb-2">
								⚠ Se detectaron {duplicateGroups.length} grupo
								{duplicateGroups.length !== 1 ? "s" : ""} de posibles duplicados
							</p>
							<div className="space-y-1">
								{duplicateGroups.map((group, i) => (
									<p key={i} className="text-xs text-yellow-300">
										Grupo {i + 1}: {group.map((t) => t.name).join(" · ")}
									</p>
								))}
							</div>
						</div>
					)}

					{/* Tabla de equipos */}
					<div className="bg-surface rounded-xl shadow overflow-hidden">
						<div className="px-4 py-3 border-b border-line flex items-center justify-between">
							<p className="text-sm font-medium text-ink">
								{teams.length} equipos en esta liga
							</p>
							{canMerge && (
								<button
									onClick={() => setConfirmOpen(true)}
									className="bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-700 font-semibold"
								>
									Fusionar seleccionados ({selected.size})
								</button>
							)}
						</div>

						<table className="w-full text-sm">
							<thead className="bg-surface-2 text-xs uppercase text-ink-2">
								<tr>
									<th className="px-4 py-2 text-left">Equipo</th>
									<th className="px-4 py-2 text-center w-28">Acción</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{teams.map((team) => {
									const isDuplicate = duplicateIds.has(team.id);
									const isKeep = keepId === team.id;
									const isSelected = selected.has(team.id);

									return (
										<tr
											key={team.id}
											className={
												isKeep
													? "bg-brand/10"
													: isSelected
														? "bg-red-950/40"
														: isDuplicate
															? "bg-yellow-950/40"
															: "hover:bg-surface-2"
											}
										>
											<td className="px-4 py-2.5">
												<div className="flex items-center gap-2">
													{isDuplicate && !isKeep && !isSelected && (
														<span
															className="w-2 h-2 rounded-full bg-yellow-500 shrink-0"
															title="Posible duplicado"
														/>
													)}
													{isKeep && (
														<span className="text-brand text-xs font-bold shrink-0">
															✓ CONSERVAR
														</span>
													)}
													{isSelected && (
														<span className="text-red-500 text-xs font-bold shrink-0">
															✕ ELIMINAR
														</span>
													)}
													<span
														className={`font-medium ${isKeep ? "text-brand" : isSelected ? "text-red-600 line-through" : "text-ink"}`}
													>
														{team.name}
													</span>
												</div>
											</td>
											<td className="px-4 py-2.5">
												<div className="flex gap-1.5 justify-center">
													{!isKeep && (
														<button
															onClick={() => handleSetKeep(team.id)}
															className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium
                                ${isSelected ? "opacity-40 cursor-not-allowed" : "border-brand/30 text-brand hover:bg-brand/10"}`}
															disabled={isSelected}
														>
															Conservar
														</button>
													)}
													{!isSelected && !isKeep && (
														<button
															onClick={() => toggleSelect(team.id)}
															className="text-xs px-2.5 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-950/40 font-medium transition"
														>
															Eliminar
														</button>
													)}
													{isSelected && (
														<button
															onClick={() => toggleSelect(team.id)}
															className="text-xs px-2.5 py-1 rounded-lg border border-line text-ink-2 hover:bg-surface-2"
														>
															Desmarcar
														</button>
													)}
													{isKeep && (
														<button
															onClick={() => setKeepId("")}
															className="text-xs px-2.5 py-1 rounded-lg border border-line text-ink-2 hover:bg-surface-2"
														>
															Desmarcar
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</>
			)}

			{/* Modal de confirmación */}
			{confirmOpen && keepTeam && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
					<div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
						<h2 className="font-bold text-ink text-lg">Confirmar fusión</h2>

						<div className="bg-brand/10 border border-brand/20 rounded-lg p-3 text-sm">
							<p className="text-brand font-semibold">Se conservará:</p>
							<p className="text-brand font-bold mt-0.5">📌 {keepTeam.name}</p>
						</div>

						<div className="bg-red-950/40 border border-red-800/50 rounded-lg p-3 text-sm">
							<p className="text-red-400 font-semibold">Se eliminarán:</p>
							<ul className="mt-0.5 space-y-0.5">
								{[...selected].map((id) => {
									const t = teams.find((x) => x.id === id);
									return t ? (
										<li key={id} className="text-red-800 font-medium">
											✕ {t.name}
										</li>
									) : null;
								})}
							</ul>
						</div>

						<p className="text-xs text-ink-2">
							Todos los partidos, eventos, estadísticas y registros de jugadores de los equipos
							eliminados se reasignarán automáticamente a <strong>{keepTeam.name}</strong>. Esta
							acción no se puede deshacer.
						</p>

						<div className="flex gap-3 pt-1">
							<button
								onClick={() => setConfirmOpen(false)}
								className="flex-1 bg-surface-2 text-ink py-2.5 rounded-lg text-sm hover:bg-surface-2 font-medium"
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
