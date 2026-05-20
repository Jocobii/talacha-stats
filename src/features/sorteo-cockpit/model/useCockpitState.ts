/* eslint-disable react-hooks/refs */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CockpitMatchday, CockpitPairing, CockpitConfig, CockpitHookReturn } from "../types";
import { COCKPIT_DEBOUNCE_MS } from "../constants";
import {
	fetchCurrent,
	fetchRoster,
	fetchSortear,
	fetchPairings,
	postConfirm,
	postAttendance,
	postCreateMatchday,
	postPublish,
} from "../lib/cockpit-api";

export type UseCockpitStateReturn = CockpitHookReturn;

/** Ordena pairings por hora ascendente; los sin hora van al final. */
function sortByTime(ps: CockpitPairing[]): CockpitPairing[] {
	return [...ps].sort((a, b) => {
		if (!a.startTime && !b.startTime) return 0;
		if (!a.startTime) return 1;
		if (!b.startTime) return -1;
		return a.startTime.localeCompare(b.startTime);
	});
}

export function useCockpitState(leagueId: string): CockpitHookReturn {
	const [matchday, setMatchday] = useState<CockpitMatchday | null>(null);
	const [totalMatchdays, setTotalMatchdays] = useState(0);
	const [leagueName, setLeagueName] = useState("");
	const [config, setConfig] = useState<CockpitConfig | null>(null);
	const [venues, setVenues] = useState<import("../types").VenueOption[]>([]);
	const [teams, setTeams] = useState<import("../types").TeamWithAttendance[]>([]);
	const [pairings, setPairings] = useState<CockpitPairing[]>([]);
	const [recentPairKeys, setRecentPairKeys] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [sortearLoading, setSortearLoading] = useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [activeDrawerTab, setActiveDrawerTab] = useState("canchas");
	const [lastSeed, setLastSeed] = useState<number | null>(null);
	const [isDirty, setIsDirty] = useState(false);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const matchdayRef = useRef<CockpitMatchday | null>(null);
	matchdayRef.current = matchday;

	const loadCurrent = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		try {
			const data = await fetchCurrent(leagueId);
			if (!data) return;

			// Auto-crear la siguiente jornada si no hay activa pero sí hay fecha sugerida.
			// Esto ocurre al cerrar una jornada: evita mostrar el form de fecha al usuario.
			if (!data.matchday && data.suggestedNextDate) {
				const created = await postCreateMatchday(leagueId, data.suggestedNextDate);
				if (created) {
					// Nueva carga — la jornada recién creada aparece como draft y entra al flujo normal
					const fresh = await fetchCurrent(leagueId);
					if (fresh) {
						setMatchday(fresh.matchday);
						setTotalMatchdays(fresh.totalMatchdays);
						setLeagueName(fresh.leagueName);
						setVenues(fresh.venues);
						setConfig(fresh.config);
						// Cargar el roster de la jornada recién creada
						if (fresh.matchday) {
							const roster = await fetchRoster(leagueId, fresh.matchday.number);
							setTeams(roster);
						}
					}
					return;
				}
			}

			setMatchday(data.matchday);
			setTotalMatchdays(data.totalMatchdays);
			setLeagueName(data.leagueName);
			setVenues(data.venues);
			setConfig(data.config);

			if (data.matchday) {
				const [roster, existingPairings] = await Promise.all([
					fetchRoster(leagueId, data.matchday.number),
					data.matchday.matchCount > 0
						? fetchPairings(leagueId, data.matchday.number)
						: Promise.resolve([] as import("../types").CockpitPairing[]),
				]);
				setTeams(roster);
				if (existingPairings.length > 0) {
					setPairings(sortByTime(existingPairings));
					// Synthetic seed so the debounce auto-save wires up correctly
					setLastSeed(0);
					setIsDirty(false);
				}
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Error al cargar el sorteo";
			setLoadError(msg);
		} finally {
			setLoading(false);
		}
	}, [leagueId]);

	const createMatchday = useCallback(
		async (scheduledDate: string) => {
			if (await postCreateMatchday(leagueId, scheduledDate)) await loadCurrent();
		},
		[leagueId, loadCurrent],
	);

	const toggleAttendance = useCallback(
		async (teamId: string, status: "presente" | "ausente") => {
			const md = matchdayRef.current;
			if (!md) return;
			setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, status } : t)));
			await postAttendance(leagueId, md.number, teamId, status);
		},
		[leagueId],
	);

	const sortear = useCallback(
		async (seed?: number) => {
			const md = matchdayRef.current;
			if (!md) return;
			setSortearLoading(true);
			try {
				const data = await fetchSortear(leagueId, md.number, seed);
				if (!data) return;
				setLastSeed(data.seed);
				const keys = new Set<string>();
				data.pairings
					.filter((p) => p.isConflict && p.awayTeamId)
					.forEach((p) => keys.add([p.homeTeamId, p.awayTeamId].sort().join("|")));
				setRecentPairKeys(keys);
				setPairings(sortByTime(data.pairings.map((p, i) => ({ ...p, uid: String(i) }))));
				// isDirty=true dispara el debounce → auto-save a DB.
				// Sin esto los pairings solo existen en memoria y se pierden al navegar.
				setIsDirty(true);
			} finally {
				setSortearLoading(false);
			}
		},
		[leagueId],
	);

	const changeTeam = useCallback((pairingIdx: number, role: "home" | "away", newTeamId: string) => {
		setPairings((prev) => {
			const np = prev.slice();
			const cur = np[pairingIdx];
			const oldId = role === "home" ? cur.homeTeamId : cur.awayTeamId;
			if (newTeamId === oldId) return prev;
			const otherIdx = np.findIndex(
				(p, i) => i !== pairingIdx && (p.homeTeamId === newTeamId || p.awayTeamId === newTeamId),
			);
			if (otherIdx >= 0) {
				const other = np[otherIdx];
				np[otherIdx] = {
					...other,
					[other.homeTeamId === newTeamId ? "homeTeamId" : "awayTeamId"]: oldId ?? "",
				};
			}
			np[pairingIdx] = { ...cur, [role === "home" ? "homeTeamId" : "awayTeamId"]: newTeamId };
			return np;
		});
		setIsDirty(true);
	}, []);

	const swapHomeAway = useCallback((idx: number) => {
		setPairings((prev) => {
			const np = prev.slice();
			const p = np[idx];
			np[idx] = { ...p, homeTeamId: p.awayTeamId ?? p.homeTeamId, awayTeamId: p.homeTeamId };
			return np;
		});
		setIsDirty(true);
	}, []);

	const changeVenue = useCallback((idx: number, venueId: string) => {
		setPairings((prev) => {
			const np = prev.slice();
			np[idx] = { ...np[idx], venueId };
			return np; // no re-sort: la cancha no cambia el orden de hora
		});
		setIsDirty(true);
	}, []);

	const changeTime = useCallback((idx: number, startTime: string) => {
		setPairings((prev) => {
			const np = prev.slice();
			np[idx] = { ...np[idx], startTime };
			return sortByTime(np); // re-ordenar al cambiar hora
		});
		setIsDirty(true);
	}, []);

	const deletePairing = useCallback((idx: number) => {
		setPairings((prev) => prev.filter((_, i) => i !== idx));
		setIsDirty(true);
	}, []);

	const confirmPairings = useCallback(async () => {
		const md = matchdayRef.current;
		if (!md || lastSeed === null) return;
		setConfirmLoading(true);
		try {
			await postConfirm(leagueId, md.number, lastSeed, pairings);
			setIsDirty(false);
		} finally {
			setConfirmLoading(false);
		}
	}, [leagueId, pairings, lastSeed]);

	const publishMatchday = useCallback(async () => {
		const md = matchdayRef.current;
		if (!md) return;
		await postPublish(leagueId, md.number);
		await loadCurrent();
	}, [leagueId, loadCurrent]);

	useEffect(() => {
		if (!isDirty || pairings.length === 0 || lastSeed === null) return;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			void confirmPairings();
		}, COCKPIT_DEBOUNCE_MS);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [pairings, isDirty, lastSeed, confirmPairings]);

	const updateConfig = useCallback((partial: Partial<import("../types").CockpitConfig>) => {
		setConfig((prev) => (prev ? { ...prev, ...partial } : prev));
	}, []);

	const openDrawer = useCallback((tab: string) => {
		setActiveDrawerTab(tab);
		setDrawerOpen(true);
	}, []);
	const closeDrawer = useCallback(() => setDrawerOpen(false), []);

	return {
		matchday,
		totalMatchdays,
		leagueName,
		config,
		venues,
		teams,
		pairings,
		recentPairKeys,
		loading,
		loadError,
		sortearLoading,
		confirmLoading,
		drawerOpen,
		activeDrawerTab,
		lastSeed,
		isDirty,
		loadCurrent,
		createMatchday,
		toggleAttendance,
		sortear,
		changeTeam,
		swapHomeAway,
		changeVenue,
		changeTime,
		deletePairing,
		confirmPairings,
		publishMatchday,
		updateConfig,
		openDrawer,
		closeDrawer,
	};
}
