"use client";

import type { AnomalyReport } from "../anomaly-detector";

type Props = {
	anomalyReports: AnomalyReport[];
};

export function AnomalyPanel({ anomalyReports }: Props) {
	const critical = anomalyReports.filter((r) => r.level === "critical");
	const warned = anomalyReports.filter((r) => r.level === "warning");

	if (critical.length === 0 && warned.length === 0) return null;

	return (
		<div className="flex flex-col gap-3">
			<div
				className={[
					"flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border",
					critical.length > 0
						? "bg-red-950/40 border-red-800/50 text-red-400"
						: "bg-amber-50 border-amber-200 text-amber-800",
				].join(" ")}
			>
				<span>{critical.length > 0 ? "🚨" : "⚠️"}</span>
				<span>
					{critical.length > 0 &&
						`${critical.length} anomalía${critical.length !== 1 ? "s" : ""} crítica${critical.length !== 1 ? "s" : ""}`}
					{critical.length > 0 && warned.length > 0 && " · "}
					{warned.length > 0 && `${warned.length} aviso${warned.length !== 1 ? "s" : ""}`}
					{" — Revisa antes de importar"}
				</span>
			</div>

			{critical.map((r) => (
				<div key={r.rawName} className="bg-red-950/40 border-2 border-red-800/50 rounded-2xl p-4">
					<div className="flex items-center gap-2 mb-2">
						<span className="font-bold text-red-400 text-sm">{r.rawName}</span>
						<span className="ml-auto text-xs font-bold uppercase tracking-wide bg-red-200 text-red-400 px-2 py-0.5 rounded-full">
							Crítico
						</span>
					</div>
					<ul className="space-y-1">
						{r.flags.map((f, i) => (
							<li key={i} className="text-xs text-red-400 flex items-start gap-1.5">
								<span className="shrink-0 mt-0.5">•</span>
								<span>{f.message}</span>
							</li>
						))}
					</ul>
				</div>
			))}

			{warned.length > 0 && (
				<details className="bg-amber-50 border border-amber-200 rounded-2xl group">
					<summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-amber-800 select-none list-none flex items-center gap-2">
						<span>⚠️</span>
						{warned.length === 1 ? "1 aviso" : `${warned.length} avisos`} — puede ser normal
						<span className="ml-auto text-xs text-amber-600 group-open:hidden">Ver ▼</span>
						<span className="ml-auto text-xs text-amber-600 hidden group-open:inline">
							Ocultar ▲
						</span>
					</summary>
					<div className="px-4 pb-4 pt-2 border-t border-amber-200 space-y-3">
						{warned.map((r) => (
							<div key={r.rawName}>
								<p className="text-xs font-bold text-amber-900 mb-1">{r.rawName}</p>
								<ul className="space-y-0.5">
									{r.flags.map((f, i) => (
										<li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
											<span className="shrink-0">•</span>
											<span>{f.message}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</details>
			)}
		</div>
	);
}
