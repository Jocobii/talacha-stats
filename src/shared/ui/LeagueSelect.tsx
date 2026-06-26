"use client";

import { useLeagues } from "@/shared/hooks/useLeagues";

type Props = {
	value: string;
	onChange: (leagueId: string) => void;
	/** Filtra ligas por ciudad y re-fetcha cuando cambia */
	city?: string;
	/** Sobrescribe las clases del <select> para páginas con estilos propios */
	selectClassName?: string;
	id?: string;
};

const DEFAULT_CLASS =
	"w-full bg-surface-2 text-ink border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 [color-scheme:dark]";

export function LeagueSelect({ value, onChange, city, selectClassName, id }: Props) {
	const { data: leagues = [], isLoading } = useLeagues(city);

	return (
		<select
			id={id}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={isLoading}
			className={selectClassName ?? DEFAULT_CLASS}
		>
			{isLoading ? (
				<option value="">Cargando ligas…</option>
			) : leagues.length === 0 ? (
				<option value="">No hay ligas activas</option>
			) : (
				<>
					<option value="">— Seleccionar liga —</option>
					{leagues.map((league) => (
						<option key={league.id} value={league.id}>
							{league.label}
						</option>
					))}
				</>
			)}
		</select>
	);
}
