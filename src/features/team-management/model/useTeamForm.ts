"use client";

/**
 * features/team-management/model/useTeamForm.ts
 * Estado del formulario de edicion del equipo (nombre, color).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEAM_API_URL } from "../constants";
import type { TeamFormData } from "../types";

export type UseTeamFormReturn = {
	name: string;
	color: string;
	saving: boolean;
	saved: boolean;
	error: string;
	setName: (v: string) => void;
	setColor: (v: string) => void;
	handleSave: () => Promise<void>;
};

export function useTeamForm(teamId: string, initial: TeamFormData): UseTeamFormReturn {
	const [name, setName] = useState(initial.name);
	const [color, setColor] = useState(initial.color);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	async function handleSave(): Promise<void> {
		if (!name.trim()) {
			setError("El nombre es requerido");
			return;
		}
		setSaving(true);
		setError("");
		setSaved(false);
		try {
			const res = await fetch(TEAM_API_URL(teamId), {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), color: color || null }),
			});
			const data = (await res.json()) as { ok: boolean; error?: string };
			if (!data.ok) {
				setError(data.error ?? "Error al guardar");
				return;
			}
			setSaved(true);
			router.refresh();
			setTimeout(() => setSaved(false), 3000);
		} finally {
			setSaving(false);
		}
	}

	return { name, color, saving, saved, error, setName, setColor, handleSave };
}
