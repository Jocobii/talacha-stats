/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { apiFetch } from "@/shared/api/client";
import { LeagueSelect } from "@/features/league-selection";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";
import CityFilter from "@/shared/ui/CityFilter";
import { NarratorReport } from "@/features/narrator-analysis/ui/NarratorReport";
import type { NarratorAnalysis } from "@/entities/narrator";

type Team = { id: string; name: string };

export default function AnalysisPage() {
	return (
		<div className="text-ink flex flex-col flex-1">
			<header className="bg-pitch px-5 pt-8 pb-6 max-w-2xl mx-auto w-full">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
				>
					<ArrowLeft size={16} strokeWidth={2} />
					Inicio
				</Link>
				<div className="flex items-center gap-2 mb-1">
					<BarChart3 size={24} className="text-brand-ink" strokeWidth={2} />
					<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
						Análisis
					</h1>
				</div>
				<div className="flex items-center justify-between mt-2">
					<p className="text-ink-2 text-sm">
						Selecciona dos equipos y obtén el análisis completo del partido.
					</p>
					<div className="shrink-0">
						<CityFilter />
					</div>
				</div>
			</header>

			<div className="bg-surface flex-1 rounded-t-3xl px-4 pt-6 pb-16">
				<div className="max-w-2xl mx-auto">
					<Suspense fallback={<p className="text-sm text-ink-3 py-8 text-center">Cargando…</p>}>
						<AnalysisContent />
					</Suspense>
				</div>
			</div>
		</div>
	);
}

function AnalysisContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const [leagueId, setLeagueId] = useState("");
	const [leagueTeams, setLeagueTeams] = useState<Team[]>([]);
	const [teamA, setTeamA] = useState("");
	const [teamB, setTeamB] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [analysis, setAnalysis] = useState<NarratorAnalysis | null>(null);
	const [copied, setCopied] = useState(false);

	const urlParams = useRef<{ leagueId: string; teamA: string; teamB: string } | null>(null);

	const city = searchParams.get("city") ?? "Tijuana";

	useEffect(() => {
		const urlLeague = searchParams.get("leagueId");
		const urlTeamA = searchParams.get("teamA");
		const urlTeamB = searchParams.get("teamB");

		if (urlLeague && urlTeamA && urlTeamB) {
			// Hay params en la URL: guardarlos y cargar la liga.
			// NO resetear el estado aquí — el segundo useEffect se encarga
			// de buscar los equipos y disparar el análisis automáticamente.
			urlParams.current = { leagueId: urlLeague, teamA: urlTeamA, teamB: urlTeamB };
			setLeagueId(urlLeague);
		} else {
			// Sin params: limpiar todo (ej. al cambiar de ciudad sin URL compartida)
			setLeagueId("");
			setLeagueTeams([]);
			setTeamA("");
			setTeamB("");
			setAnalysis(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [city]);

	useEffect(() => {
		if (!leagueId) {
			setLeagueTeams([]);
			return;
		}

		fetch(`/api/teams?league_id=${leagueId}`)
			.then((r) => r.json())
			.then(async (d) => {
				const teams: Team[] = d.data ?? [];
				setLeagueTeams(teams);

				const params = urlParams.current;
				if (params && params.leagueId === leagueId) {
					urlParams.current = null;

					const aExists = teams.some((t) => t.id === params.teamA);
					const bExists = teams.some((t) => t.id === params.teamB);

					if (!aExists || !bExists) {
						setError(
							!aExists && !bExists
								? "Los equipos del enlace no se encontraron en esta liga."
								: `El equipo ${!aExists ? "A" : "B"} del enlace no se encontró en esta liga.`,
						);
						return;
					}

					setTeamA(params.teamA);
					setTeamB(params.teamB);

					setLoading(true);
					setError("");
					try {
						const result = await apiFetch<NarratorAnalysis>(
							`/api/narrator?leagueId=${leagueId}&teamA=${params.teamA}&teamB=${params.teamB}`,
						);
						if (!result.ok) {
							setError(result.error);
							return;
						}
						setAnalysis(result.data);
					} catch (networkError) {
						console.error("[analysis] carga desde enlace", networkError);
						setError("Error de red al generar el análisis.");
					} finally {
						setLoading(false);
					}
					return;
				}

				setTeamA("");
				setTeamB("");
				setAnalysis(null);
			});
	}, [leagueId]);

	async function handleAnalyze() {
		if (!teamA || !teamB || !leagueId) {
			setError("Selecciona liga y dos equipos.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			const result = await apiFetch<NarratorAnalysis>(
				`/api/narrator?leagueId=${leagueId}&teamA=${teamA}&teamB=${teamB}`,
			);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setAnalysis(result.data);
			router.replace(`?leagueId=${leagueId}&teamA=${teamA}&teamB=${teamB}`, { scroll: false });
		} catch (networkError) {
			console.error("[analysis] handleAnalyze", networkError);
			setError("Error de red al generar el análisis.");
		} finally {
			setLoading(false);
		}
	}

	async function handleShare() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (clipboardError) {
			// §18.4 — clipboard puede fallar (permisos/secure context); registrar, no romper la UI.
			console.error("[analysis] no se pudo copiar al portapapeles", clipboardError);
		}
	}

	const selectCls =
		"w-full bg-pitch border border-line text-ink rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand appearance-none cursor-pointer";

	return (
		<div className="space-y-4">
			<div className="bg-surface-2 border border-line rounded-2xl p-5 space-y-4">
				<div>
					<label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">
						Liga
					</label>
					<LeagueSelect
						value={leagueId}
						onChange={setLeagueId}
						city={city}
						selectClassName={selectCls}
					/>
				</div>

				{leagueTeams.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">
								<span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5" />
								Equipo A
							</label>
							<select
								value={teamA}
								onChange={(e) => setTeamA(e.target.value)}
								className={selectCls}
							>
								<option value="">— Seleccionar —</option>
								{leagueTeams
									.filter((t) => t.id !== teamB)
									.map((t) => (
										<option key={t.id} value={t.id}>
											{t.name}
										</option>
									))}
							</select>
						</div>
						<div>
							<label className="block text-xs font-semibold text-ink-2 uppercase tracking-widest mb-2">
								<span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1.5" />
								Equipo B
							</label>
							<select
								value={teamB}
								onChange={(e) => setTeamB(e.target.value)}
								className={selectCls}
							>
								<option value="">— Seleccionar —</option>
								{leagueTeams
									.filter((t) => t.id !== teamA)
									.map((t) => (
										<option key={t.id} value={t.id}>
											{t.name}
										</option>
									))}
							</select>
						</div>
					</div>
				)}

				{error && (
					<p className="text-red-400 text-sm bg-red-950 border border-red-900 px-3 py-2 rounded-xl">
						{error}
					</p>
				)}

				<button
					onClick={handleAnalyze}
					disabled={loading || !teamA || !teamB}
					className="w-full bg-brand hover:bg-brand-dim disabled:opacity-40 text-pitch font-display font-black text-lg uppercase tracking-wide py-3.5 rounded-xl transition"
				>
					{loading ? "Analizando…" : "Generar análisis"}
				</button>
			</div>

			{analysis && (
				<NarratorReport
					analysis={analysis}
					actions={
						<ReportActions
							exportParams={`leagueId=${leagueId}&teamA=${teamA}&teamB=${teamB}`}
							onShare={handleShare}
							copied={copied}
						/>
					}
				/>
			)}
		</div>
	);
}

function ReportActions({
	exportParams,
	onShare,
	copied,
}: {
	exportParams: string;
	onShare: () => void;
	copied: boolean;
}) {
	const actionBtnCls =
		"flex items-center gap-1.5 bg-surface-2 border border-line text-ink-2 hover:text-ink text-sm font-medium px-4 py-2 rounded-xl transition";
	return (
		<>
			<button onClick={onShare} className={actionBtnCls}>
				{copied ? "✅ Copiado" : "🔗 Compartir"}
			</button>
			<a href={`/api/narrator/export?format=pdf&${exportParams}`} download className={actionBtnCls}>
				🖨️ PDF
			</a>
			<a href={`/api/narrator/export?format=png&${exportParams}`} download className={actionBtnCls}>
				🖼️ PNG
			</a>
		</>
	);
}
