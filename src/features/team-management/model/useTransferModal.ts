"use client";

/**
 * features/team-management/model/useTransferModal.ts
 * Estado del formulario de transferencia (equipo destino + carta de salida).
 * La carga de equipos disponibles vive en `useLeagueTeams` (TanStack Query).
 */

import { useState, useCallback } from "react";
import type { TransferFormData } from "../types";

export type UseTransferModalReturn = {
	targetTeamId: string;
	hasExitLetter: boolean;
	setTargetTeamId: (id: string) => void;
	setHasExitLetter: (value: boolean) => void;
	getFormData: () => TransferFormData;
};

export function useTransferModal(): UseTransferModalReturn {
	const [targetTeamId, setTargetTeamId] = useState("");
	const [hasExitLetter, setHasExitLetter] = useState(false);

	const getFormData = useCallback(
		(): TransferFormData => ({ targetTeamId, hasExitLetter }),
		[targetTeamId, hasExitLetter],
	);

	return { targetTeamId, hasExitLetter, setTargetTeamId, setHasExitLetter, getFormData };
}
