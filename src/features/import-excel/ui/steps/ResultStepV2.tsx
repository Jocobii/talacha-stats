"use client";

import type { ConfirmImportResult } from "../../types";

type Props = {
	result: ConfirmImportResult;
	jornada?: number;
	onReset: () => void;
};

export function ResultStepV2({ result, jornada, onReset }: Props) {
	const { createdProfiles, updatedProfiles, claimsProposed, claimsAutoVerified, errors } = result;

	const blocks = [
		{
			label: "Jugadores ya registrados",
			sublabel: "Estadísticas actualizadas con los datos del Excel",
			value: updatedProfiles,
			icon: "✏️",
			color: "bg-brand/10 border-brand/20 text-brand",
		},
		{
			label: "Perfiles nuevos creados",
			sublabel: "Sin identidad global aún (pendientes de reclamar)",
			value: createdProfiles,
			icon: "🆕",
			color: "bg-blue-50 border-blue-200 text-blue-700",
		},
		...(claimsAutoVerified > 0
			? [
					{
						label: "Vinculaciones verificadas",
						sublabel: "Mutual claim: otra org también lo confirmó",
						value: claimsAutoVerified,
						icon: "✅",
						color: "bg-green-50 border-green-200 text-green-700",
					},
				]
			: []),
		...(claimsProposed > 0
			? [
					{
						label: "Propuestas de vinculación",
						sublabel: "Pendientes hasta que la otra org confirme",
						value: claimsProposed,
						icon: "🌐",
						color: "bg-orange-50 border-orange-200 text-orange-700",
					},
				]
			: []),
	];

	return (
		<div className="flex flex-col gap-5">
			{/* Hero */}
			<div className="bg-brand/10 border-2 border-brand/20 rounded-3xl p-8 text-center">
				<div className="text-5xl mb-3">🎉</div>
				<h2
					className="text-2xl font-black text-brand mb-1"
					style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
				>
					¡Importación completada
					{jornada != null ? ` · Jornada ${jornada}` : ""}!
				</h2>
				<p className="text-sm text-brand/80">
					{updatedProfiles + createdProfiles} jugadores procesados
				</p>
			</div>

			{/* Stat blocks */}
			<div className="grid grid-cols-2 gap-3">
				{blocks.map((b) => (
					<div
						key={b.label}
						className={["rounded-xl border p-4 flex flex-col gap-1", b.color].join(" ")}
					>
						<div className="flex items-center gap-2">
							<span className="text-xl">{b.icon}</span>
							<span className="text-3xl font-black">{b.value}</span>
						</div>
						<p className="text-[13px] font-semibold leading-snug">{b.label}</p>
						<p className="text-[11px] opacity-75 leading-snug">{b.sublabel}</p>
					</div>
				))}
			</div>

			{/* Errors (partial failures) */}
			{errors.length > 0 && (
				<div className="rounded-xl bg-red-50 border border-red-200 p-4">
					<p className="text-sm font-semibold text-red-700 mb-2">
						{errors.length} fila{errors.length > 1 ? "s" : ""} con error
					</p>
					<ul className="flex flex-col gap-1">
						{errors.map((e, i) => (
							<li key={i} className="text-xs text-red-600">
								• {e}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Claims explanation */}
			{claimsProposed > 0 && (
				<div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-xs text-orange-800 leading-relaxed">
					<span className="font-semibold">¿Qué pasa con las propuestas?</span> Cuando la otra
					organización también proponga el mismo jugador, o cuando el jugador reclame su perfil, la
					vinculación se verificará automáticamente.
				</div>
			)}

			<button
				type="button"
				onClick={onReset}
				className="w-full py-3.5 rounded-xl border-2 border-brand text-brand font-bold text-sm hover:bg-brand hover:text-white transition"
			>
				Importar otra jornada
			</button>
		</div>
	);
}
