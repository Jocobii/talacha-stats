"use client";

/**
 * features/team-management/model/useTeamForm.ts
 * Estado del formulario de edición del equipo (nombre, color). La escritura vive
 * en useUpdateTeam (TanStack Query). Mantiene `router.refresh()` SOLO para
 * reflejar el rename en el título, que se renderiza en el Server Component (SSR);
 * la caché cliente ya se invalida en la mutación. (Cuando el detalle del equipo
 * pase a ser query con initialData, esto se vuelve invalidación pura.)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateTeam } from "./useUpdateTeam";
import type { TeamFormData } from "../types";

export type UseTeamFormReturn = {
	name: string;
	color: string;
	saving: boolean;
	saved: boolean;
	error: string;
	setName: (value: string) => void;
	setColor: (value: string) => void;
	handleSave: () => void;
};

export function useTeamForm(
	teamId: string,
	leagueId: string,
	initial: TeamFormData,
): UseTeamFormReturn {
	const [name, setName] = useState(initial.name);
	const [color, setColor] = useState(initial.color);
	const [saved, setSaved] = useState(false);
	const [validationError, setValidationError] = useState("");
	const router = useRouter();

	const {
		updateTeam,
		isSaving,
		error: mutationError,
	} = useUpdateTeam(teamId, leagueId, {
		onSuccess: () => {
			setSaved(true);
			router.refresh();
			setTimeout(() => setSaved(false), 3000);
		},
	});

	function handleSave(): void {
		if (!name.trim()) {
			setValidationError("El nombre es requerido");
			return;
		}
		setValidationError("");
		setSaved(false);
		updateTeam({ name: name.trim(), color });
	}

	return {
		name,
		color,
		saving: isSaving,
		saved,
		error: validationError || mutationError,
		setName,
		setColor,
		handleSave,
	};
}
