"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Banner contextual que aparece cuando el organizador llega al importador
 * justo después de crear una liga (from=new-league en la URL).
 * Muestra el nombre de la liga y orienta el primer paso.
 */
export default function NewLeagueBanner() {
	const searchParams = useSearchParams();
	const leagueId = searchParams.get("leagueId");
	const from = searchParams.get("from");

	const [leagueName, setLeagueName] = useState<string | null>(null);

	useEffect(() => {
		if (!leagueId || from !== "new-league") return;

		fetch(`/api/leagues/${leagueId}`)
			.then((r) => r.json())
			.then((d) => {
				if (d.ok && d.data?.name) setLeagueName(d.data.name);
			})
			.catch(() => {
				// Si falla el fetch, el banner igual se muestra sin nombre
				setLeagueName("");
			});
	}, [leagueId, from]);

	// Solo mostrar si viene de crear una liga
	if (from !== "new-league" || !leagueId) return null;

	return (
		<div className="mb-6 rounded-xl border border-brand/30 bg-brand/5 px-5 py-4 flex items-start gap-4">
			<span className="text-2xl mt-0.5">🎉</span>
			<div className="flex-1">
				<p className="text-sm font-semibold text-ink">
					{leagueName ? (
						<>Liga &ldquo;{leagueName}&rdquo; creada con éxito.</>
					) : (
						<>¡Liga creada con éxito!</>
					)}
				</p>
				<p className="text-sm text-ink-2 mt-0.5">
					Este es tu primer paso: importa las estadísticas de tu temporada y tu tabla de posiciones
					y goleadores se generan solos.
				</p>
			</div>
			<Link
				href={`/admin/leagues/${leagueId}`}
				className="text-xs text-ink-3 hover:text-ink whitespace-nowrap mt-0.5"
			>
				Ver liga →
			</Link>
		</div>
	);
}
