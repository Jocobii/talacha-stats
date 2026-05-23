"use client";

import type { PlayerResolution } from "../resolver";

type Props = {
	pm: PlayerResolution;
	resolution: string;
	onResolve: (rawName: string, playerId: string) => void;
};

export function PlayerResolutionCard({ pm, resolution, onResolve }: Props) {
	const isResolved = !!resolution;
	const chosenCandidate = pm.candidates.find((c) => c.id === resolution);

	return (
		<div
			className={[
				"rounded-2xl border-2 overflow-hidden transition-all duration-200",
				isResolved ? "border-brand/30 bg-brand/10" : "border-orange-300 bg-surface",
			].join(" ")}
		>
			{/* Header */}
			<div
				className={[
					"px-4 py-3 flex items-center gap-3 border-b",
					isResolved ? "border-green-100" : "border-orange-100",
				].join(" ")}
			>
				<div
					className={[
						"w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-lg",
						isResolved ? "bg-brand/15" : "bg-orange-100",
					].join(" ")}
				>
					{isResolved ? "✅" : "⚠️"}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline gap-2 flex-wrap">
						<span className="text-base font-extrabold text-ink">{pm.rawName}</span>
						{pm.teamName && <span className="text-xs text-ink-2">{pm.teamName}</span>}
					</div>
					{isResolved && resolution !== "NEW" && chosenCandidate && (
						<p className="text-xs text-brand-ink font-medium mt-0.5">
							→ {chosenCandidate.fullName}
							{chosenCandidate.alias ? ` "${chosenCandidate.alias}"` : ""}
						</p>
					)}
					{isResolved && resolution === "NEW" && (
						<p className="text-xs text-blue-300 font-medium mt-0.5">→ Se creará jugador nuevo</p>
					)}
					{!isResolved && <p className="text-xs text-orange-700 mt-0.5">¿Cuál es este jugador?</p>}
				</div>
			</div>

			{/* Candidates */}
			<div className="px-4 py-3 flex flex-col gap-2">
				<p className="text-xs font-semibold text-ink-2 mb-1">Elige el jugador correcto:</p>

				{pm.candidates.map((c) => {
					const selected = resolution === c.id;
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => onResolve(pm.rawName, c.id)}
							className={[
								"flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left w-full transition-all duration-150",
								selected
									? "border-brand bg-brand/10"
									: "border-line bg-surface-2 hover:border-brand/30",
							].join(" ")}
						>
							{/* Radio indicator */}
							<div
								className={[
									"w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all",
									selected ? "border-green-600 bg-brand" : "border-line bg-surface",
								].join(" ")}
							>
								{selected && <div className="w-1.5 h-1.5 rounded-full bg-surface" />}
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-1.5 flex-wrap">
									<span className="text-sm font-bold text-ink">{c.fullName}</span>
									{c.alias && (
										<span className="text-xs text-ink-2 italic">&quot;{c.alias}&quot;</span>
									)}
								</div>
								{c.teams.length > 0 && (
									<div className="flex gap-1 mt-1 flex-wrap">
										{c.teams.map((t, i) => (
											<span
												key={i}
												className="text-[11px] bg-surface-2 text-ink-2 px-2 py-0.5 rounded-full"
											>
												{t.teamName} · {t.leagueName}
											</span>
										))}
									</div>
								)}
							</div>

							{selected && <span className="text-brand-ink text-lg shrink-0">✓</span>}
						</button>
					);
				})}

				{/* Create new player option */}
				<button
					type="button"
					onClick={() => onResolve(pm.rawName, "NEW")}
					className={[
						"flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left w-full transition-all duration-150",
						resolution === "NEW"
							? "border-blue-400 bg-blue-950/40"
							: "border-line bg-surface-2 hover:border-blue-800/50",
					].join(" ")}
				>
					<div
						className={[
							"w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all",
							resolution === "NEW" ? "border-blue-600 bg-blue-600" : "border-line bg-surface",
						].join(" ")}
					>
						{resolution === "NEW" && <div className="w-1.5 h-1.5 rounded-full bg-surface" />}
					</div>
					<span
						className={[
							"text-sm font-semibold",
							resolution === "NEW" ? "text-blue-300" : "text-ink-2",
						].join(" ")}
					>
						+ Es un jugador nuevo — crear perfil
					</span>
					{resolution === "NEW" && (
						<span className="text-blue-500 text-lg ml-auto shrink-0">✓</span>
					)}
				</button>
			</div>
		</div>
	);
}
