"use client";

import { useState } from "react";
import Link from "next/link";

type Member = { id: string; name: string; email: string };
type League = { id: string; name: string; dayOfWeek: string; season: string; status: string };
type OrgData = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	city: string;
	members: Member[];
	leagues: League[];
};

const DAY_LABELS: Record<string, string> = {
	lunes: "Lun",
	martes: "Mar",
	miercoles: "Mié",
	jueves: "Jue",
	viernes: "Vie",
	sabado: "Sáb",
	domingo: "Dom",
};

export default function OrganizationDetailClient({
	org,
	allUsers,
	isOwner,
}: {
	org: OrgData;
	allUsers: Member[];
	isOwner: boolean;
}) {
	const [memberError, setMemberError] = useState("");
	const [memberLoading, setMemberLoading] = useState<string | null>(null);
	const [selectedUser, setSelectedUser] = useState("");

	const memberIds = new Set(org.members.map((m) => m.id));
	const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

	async function handleMemberAction(userId: string, action: "add" | "remove") {
		setMemberLoading(userId);
		setMemberError("");
		try {
			const res = await fetch(`/api/organizations/${org.id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, action }),
			});
			const data = await res.json();
			if (!data.ok) {
				setMemberError(data.error);
				return;
			}
			window.location.reload();
		} finally {
			setMemberLoading(null);
		}
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Ligas */}
			<div className="lg:col-span-2">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-gray-700">Ligas</h2>
					<Link
						href={`/admin/leagues/new`}
						className="text-sm text-green-600 hover:underline font-medium"
					>
						+ Nueva liga
					</Link>
				</div>

				{org.leagues.length === 0 ? (
					<div className="bg-white rounded-xl shadow p-8 text-center">
						<p className="text-gray-400 text-sm">Esta organización aún no tiene ligas.</p>
						<Link
							href="/admin/leagues/new"
							className="text-green-600 text-sm hover:underline mt-2 block"
						>
							Crear primera liga →
						</Link>
					</div>
				) : (
					<div className="space-y-2">
						{org.leagues.map((league) => (
							<Link
								key={league.id}
								href={`/admin/leagues/${league.id}`}
								className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3 hover:shadow-md transition"
							>
								<div>
									<p className="font-medium text-gray-800 text-sm">{league.name}</p>
									<p className="text-xs text-gray-400">
										{DAY_LABELS[league.dayOfWeek] ?? league.dayOfWeek} · {league.season}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span
										className={`text-xs px-2 py-0.5 rounded-full font-medium ${
											league.status === "active"
												? "bg-green-100 text-green-700"
												: "bg-gray-100 text-gray-500"
										}`}
									>
										{league.status === "active" ? "Activa" : "Finalizada"}
									</span>
									<span className="text-gray-300 text-xs">→</span>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>

			{/* Miembros */}
			<div>
				<h2 className="text-lg font-semibold text-gray-700 mb-3">Miembros</h2>
				<div className="bg-white rounded-xl shadow p-4 space-y-4">
					{org.members.length === 0 ? (
						<p className="text-sm text-gray-400">Sin miembros asignados.</p>
					) : (
						<div className="space-y-2">
							{org.members.map((m) => (
								<div key={m.id} className="flex items-center justify-between gap-2">
									<div className="min-w-0">
										<p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
										<p className="text-xs text-gray-400 truncate">{m.email}</p>
									</div>
									{isOwner && (
										<button
											onClick={() => handleMemberAction(m.id, "remove")}
											disabled={memberLoading === m.id}
											className="text-xs text-red-500 hover:underline flex-shrink-0 disabled:opacity-50"
										>
											Quitar
										</button>
									)}
								</div>
							))}
						</div>
					)}

					{isOwner && availableUsers.length > 0 && (
						<div className="border-t border-gray-100 pt-3">
							<p className="text-xs font-medium text-gray-600 mb-2">Agregar miembro</p>
							<div className="flex gap-2">
								<select
									value={selectedUser}
									onChange={(e) => setSelectedUser(e.target.value)}
									className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
								>
									<option value="">— Seleccionar —</option>
									{availableUsers.map((u) => (
										<option key={u.id} value={u.id}>
											{u.name}
										</option>
									))}
								</select>
								<button
									onClick={() => {
										if (selectedUser) handleMemberAction(selectedUser, "add");
									}}
									disabled={!selectedUser || memberLoading !== null}
									className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
								>
									Agregar
								</button>
							</div>
						</div>
					)}

					{memberError && <p className="text-red-600 text-xs">{memberError}</p>}
				</div>
			</div>
		</div>
	);
}
