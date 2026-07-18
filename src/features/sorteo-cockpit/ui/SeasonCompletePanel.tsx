"use client";

/**
 * SeasonCompletePanel.tsx
 *
 * Se muestra en el Cockpit de Sorteo cuando la temporada regular ya jugo
 * todas las jornadas configuradas (regularMatchdays) y no hay jornada activa.
 * Antes de esto, useCockpitState auto-creaba una jornada mas indefinidamente
 * (ver nota en loadCurrent) — ahora, en ese punto, se ofrece arrancar la fase
 * final desde el mismo tab donde el organizador vive el dia a dia, en vez de
 * obligarlo a saber que el boton vive en el tab Calendario.
 *
 * Si la fase final YA arranco, este panel NO se queda mostrando un mensaje
 * ("ya arranco, ve al otro tab") — eso resulto molesto: si el organizador ya
 * inicio la liguilla, es obvio que quiere verla directo. El caso normal ya lo
 * evita `sorteo/page.tsx` (redirect en el servidor a Calendario si ya existe
 * bracket, sin ni cargar este componente); este efecto es solo un respaldo
 * silencioso para el caso raro en que `playoffStarted` se vuelva true DESPUES
 * de montar el cockpit (ej. se inicio la fase final desde otra pestaña) sin
 * pedirle nada al usuario.
 *
 * Confirmacion via ConfirmDialog (tone="brand", shared/ui) en vez del
 * confirm() nativo del navegador, mas una rafaga de confeti (ya usada en el
 * cockpit para el "sortear") al confirmar, antes de navegar al bracket.
 *
 * Feedback obligatorio (AGENTS.md §7.2b): el error del backend se muestra
 * con `notify.error` — antes se guardaba en un state local y se pintaba en
 * un <p> del panel, pero el ConfirmDialog (overlay fixed) se queda abierto
 * tras un error y lo tapa por completo; el usuario nunca lo veía.
 *
 * Mismo endpoint que StartPlayoffsButton (tab Calendario): POST
 * /api/leagues/[id]/playoffs/start. No se comparte el componente entre
 * features (features -> features esta prohibido, AGENTS.md S3.1); se
 * duplica la llamada, que es minima.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { Stack, Center } from "@/shared/ui/layout";
import { apiFetch } from "@/shared/api/client";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { notify } from "@/shared/lib/notify";
import { ConfettiBurst } from "./ConfettiBurst";
import { useConfettiBurst } from "../model/useConfettiBurst";

type Props = {
	leagueId: string;
	leagueName: string;
	playoffStarted: boolean;
};

const CELEBRATION_MS = 900;

export function SeasonCompletePanel({ leagueId, leagueName, playoffStarted }: Props) {
	const router = useRouter();
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const { pieces, burstId, burst } = useConfettiBurst();

	// Respaldo silencioso — ver nota de cabecera. El caso normal ya se resuelve
	// en el servidor (sorteo/page.tsx) antes de que este componente exista.
	useEffect(() => {
		if (playoffStarted) router.replace(`/admin/leagues/${leagueId}/calendario`);
	}, [playoffStarted, leagueId, router]);

	const handleStart = async () => {
		setLoading(true);
		try {
			const result = await apiFetch(`/api/leagues/${leagueId}/playoffs/start`, { method: "POST" });
			if (!result.ok) {
				notify.error(result.error ?? "Error al iniciar la fase final.");
				return;
			}
			setShowConfirm(false);
			notify.success("Fase final iniciada.");
			burst();
			// Deja ver el confeti un instante antes de saltar al bracket.
			setTimeout(() => router.push(`/admin/leagues/${leagueId}/calendario`), CELEBRATION_MS);
		} catch {
			notify.error("Error de red. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	};

	if (playoffStarted) return null;

	return (
		<Stack
			align="center"
			gap="lg"
			className="relative h-full justify-center"
			style={{ color: "var(--color-ink)" }}
		>
			<ConfettiBurst pieces={pieces} burstId={burstId} />
			<div className="text-center">
				<Center
					className="mx-auto mb-3.5 h-14 w-14 rounded-2xl"
					style={{ background: "rgba(0,230,118,0.1)" }}
				>
					<Trophy size={24} strokeWidth={2} color="var(--color-brand)" />
				</Center>
				<div
					style={{
						fontFamily: "var(--font-display)",
						fontSize: 28,
						fontWeight: 800,
						marginBottom: 8,
					}}
				>
					{leagueName}
				</div>
				<div style={{ fontSize: 14, color: "var(--color-ink-2)", maxWidth: 320 }}>
					Temporada regular completa. Genera los brackets de eliminación directa para todas las
					zonas configuradas.
				</div>
			</div>
			<button className="btn-primary" onClick={() => setShowConfirm(true)} disabled={loading}>
				{loading ? "Generando…" : "Iniciar Fase Final"}
			</button>

			{showConfirm && (
				<ConfirmDialog
					tone="brand"
					icon={Trophy}
					title="¿Iniciar la fase final?"
					description="Se generarán los brackets de eliminación directa para todas las zonas configuradas, sembrados con la posición de la última jornada."
					confirmLabel="Iniciar Fase Final"
					onConfirm={handleStart}
					onClose={() => setShowConfirm(false)}
					loading={loading}
				/>
			)}
		</Stack>
	);
}
