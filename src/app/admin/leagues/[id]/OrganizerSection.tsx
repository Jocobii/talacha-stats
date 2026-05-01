"use client";

import { useState } from "react";

type OrgMember = { id: string; name: string; email: string };
type Organization = {
	id: string;
	name: string;
	slug: string;
	logoUrl?: string | null;
	members?: OrgMember[];
};

type Props = {
	leagueId: string;
	current: Organization | null;
	organizations: Organization[]; // solo visible para el owner
	isOwner: boolean;
};

export default function OrganizationSection({ leagueId, current, organizations, isOwner }: Props) {
	const [editing, setEditing] = useState(false);
	const [selected, setSelected] = useState(current?.id ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSave() {
		setSaving(true);
		setError("");
		try {
			const res = await fetch(`/api/leagues/${leagueId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId: selected || null }),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error);
				return;
			}
			setEditing(false);
			window.location.reload();
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="bg-white rounded-lg shadow p-4">
			<h2 className="text-sm font-semibold text-gray-700 mb-3">Organización</h2>

			{editing && isOwner ? (
				<div className="space-y-3">
					<select
						value={selected}
						onChange={(e) => setSelected(e.target.value)}
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
					>
						<option value="">— Sin asignar —</option>
						{organizations.map((o) => (
							<option key={o.id} value={o.id}>
								{o.name}
							</option>
						))}
					</select>
					{error && <p className="text-red-600 text-xs">{error}</p>}
					<div className="flex gap-2">
						<button
							onClick={handleSave}
							disabled={saving}
							className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
						>
							{saving ? "Guardando..." : "Guardar"}
						</button>
						<button
							onClick={() => {
								setEditing(false);
								setSelected(current?.id ?? "");
								setError("");
							}}
							className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200"
						>
							Cancelar
						</button>
					</div>
				</div>
			) : (
				<div className="flex items-start justify-between gap-2">
					<div>
						{current ? (
							<>
								<p className="text-sm font-medium text-gray-800">{current.name}</p>
								{current.members && current.members.length > 0 && (
									<div className="mt-2 space-y-1">
										{current.members.map((m) => (
											<div key={m.id} className="flex items-center gap-1.5">
												<span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
												<p className="text-xs text-gray-500">{m.name}</p>
											</div>
										))}
									</div>
								)}
							</>
						) : (
							<p className="text-sm text-gray-400">Sin organización asignada</p>
						)}
					</div>
					{isOwner && (
						<button
							onClick={() => setEditing(true)}
							className="text-xs text-green-600 hover:underline flex-shrink-0"
						>
							Cambiar
						</button>
					)}
				</div>
			)}
		</div>
	);
}
