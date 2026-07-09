"use client";

/**
 * features/narrator-analysis/model/useNarratorMatchup.ts
 *
 * Dueño de la selección de liga + equipos del análisis pre-partido (`/analysis`).
 * Todo el ajuste de estado pasa por el patrón "ajustar estado durante el
 * render" (react.dev/learn/you-might-not-need-an-effect) — sin `useEffect`:
 *
 * - Inicializa la selección desde un enlace compartido (`?leagueId&teamA&teamB`)
 *   con un lazy initializer de `useState`.
 * - Resetea todo cuando cambia la ciudad, comparando contra el valor anterior.
 * - Reconcilia el enlace (o limpia la selección) contra los equipos reales de
 *   la liga en cuanto `useLeagueTeamOptions` resuelve, guardado con
 *   `resolvedFor` para correr UNA sola vez por liga y no repetirse en un
 *   refetch en segundo plano (§7.2 — derivar durante el render, no con un
 *   efecto + setState; el "callback en un efecto" no aplica aquí porque no
 *   hay ningún sistema externo al que suscribirse, solo datos ya disponibles
 *   en el render vía TanStack Query).
 *
 * Devuelve un `ConfirmedMatchup | null` que alimenta `useNarratorAnalysisQuery`.
 * No sabe de traducciones: los errores salen como `MatchupErrorCode` y la UI
 * decide el copy (§3.5/§7.2 — texto vive en `ui/`, no en `model/`).
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/shared/i18n/navigation";
import { useLeagueTeamOptions } from "./useLeagueTeamOptions";
import { parseLinkParams } from "../lib/parse-link-params";
import type { ConfirmedMatchup, LinkParams, MatchupErrorCode, TeamOption } from "../types";

export type NarratorMatchup = {
	leagueId: string;
	setLeagueId: (leagueId: string) => void;
	teams: TeamOption[];
	isLoadingTeams: boolean;
	teamA: string;
	setTeamA: (teamId: string) => void;
	teamB: string;
	setTeamB: (teamId: string) => void;
	confirmed: ConfirmedMatchup | null;
	errorCode: MatchupErrorCode;
	handleAnalyze: () => void;
};

export function useNarratorMatchup(city: string): NarratorMatchup {
	const searchParams = useSearchParams();
	const router = useRouter();

	// Enlace compartido leído una sola vez al montar; se consume al reconciliar.
	const [pendingLink, setPendingLink] = useState<LinkParams | null>(() =>
		parseLinkParams(searchParams),
	);
	// Liga para la que ya se corrió la reconciliación — evita repetirla en un refetch.
	const [resolvedFor, setResolvedFor] = useState<string | null>(null);

	const [leagueId, setLeagueId] = useState(() => pendingLink?.leagueId ?? "");
	const [teamA, setTeamA] = useState("");
	const [teamB, setTeamB] = useState("");
	const [confirmed, setConfirmed] = useState<ConfirmedMatchup | null>(null);
	const [errorCode, setErrorCode] = useState<MatchupErrorCode>(null);

	// Reset por cambio de ciudad.
	const [prevCity, setPrevCity] = useState(city);
	if (city !== prevCity) {
		setPrevCity(city);
		setPendingLink(null);
		setResolvedFor(null);
		setLeagueId("");
		setTeamA("");
		setTeamB("");
		setConfirmed(null);
		setErrorCode(null);
	}

	const teamsQuery = useLeagueTeamOptions(leagueId);
	const teams = teamsQuery.data ?? [];

	// Reconciliación: liga cambiada (manual o por enlace) + equipos ya cargados.
	if (leagueId && teamsQuery.data !== undefined && resolvedFor !== leagueId) {
		setResolvedFor(leagueId);

		if (pendingLink && pendingLink.leagueId === leagueId) {
			setPendingLink(null);
			const aExists = teamsQuery.data.some((team) => team.id === pendingLink.teamA);
			const bExists = teamsQuery.data.some((team) => team.id === pendingLink.teamB);

			if (!aExists || !bExists) {
				setErrorCode(
					!aExists && !bExists
						? { code: "bothLinkTeams" }
						: { code: "oneLinkTeam", team: !aExists ? "A" : "B" },
				);
			} else {
				setTeamA(pendingLink.teamA);
				setTeamB(pendingLink.teamB);
				setConfirmed({ leagueId, teamA: pendingLink.teamA, teamB: pendingLink.teamB });
			}
		} else {
			// Cambio manual de liga sin enlace pendiente: limpiar selección previa.
			setTeamA("");
			setTeamB("");
			setConfirmed(null);
		}
	}

	function handleAnalyze() {
		if (!teamA || !teamB || !leagueId) {
			setErrorCode({ code: "bothTeams" });
			return;
		}
		setErrorCode(null);
		setConfirmed({ leagueId, teamA, teamB });
		router.replace(`?leagueId=${leagueId}&teamA=${teamA}&teamB=${teamB}`, { scroll: false });
	}

	return {
		leagueId,
		setLeagueId,
		teams,
		isLoadingTeams: teamsQuery.isLoading,
		teamA,
		setTeamA,
		teamB,
		setTeamB,
		confirmed,
		errorCode,
		handleAnalyze,
	};
}
