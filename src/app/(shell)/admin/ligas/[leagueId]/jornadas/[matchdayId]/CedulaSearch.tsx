"use client";
/**
 * CedulaSearch — buscador de partidos por cédula en el dashboard de jornada.
 */
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type MatchResult = {
	id: string;
	cedula: string | null;
	homeTeamName: string;
	awayTeamName: string;
	status: string;
	roundNumber: number | null;
};

type Props = {
	leagueId: string;
	matchdayId: string;
};

export function CedulaSearch({ leagueId, matchdayId }: Props) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<MatchResult[]>([]);
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const search = useCallback(
		async (q: string) => {
			if (q.length < 1) {
				setResults([]);
				setOpen(false);
				return;
			}
			const res = await fetch(
				`/api/leagues/${leagueId}/matches/by-cedula?q=${encodeURIComponent(q)}`,
			);
			if (!res.ok) return;
			const data = await res.json();
			setResults(data.data ?? []);
			setOpen(true);
		},
		[leagueId],
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const q = e.target.value;
		setQuery(q);
		search(q);
	};

	const goToMatch = (matchId: string) => {
		setOpen(false);
		setQuery("");
		router.push(`/admin/ligas/${leagueId}/jornadas/${matchdayId}/partidos/${matchId}`);
	};

	return (
		<div className="relative w-64">
			<div className="flex items-center bg-surface-2 border border-line rounded px-2 focus-within:border-brand/60 focus-within:ring-1 focus-within:ring-brand/20 transition">
				<Search size={14} className="text-ink-3 shrink-0" />
				<input
					value={query}
					onChange={handleChange}
					onFocus={() => results.length > 0 && setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 150)}
					placeholder="Buscar por cédula…"
					className="w-full px-2 py-1.5 text-sm bg-transparent text-ink placeholder:text-ink-3 focus:outline-none"
				/>
			</div>
			{open && results.length > 0 && (
				<ul className="absolute top-full left-0 right-0 z-10 bg-surface border border-line rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
					{results.map((m) => (
						<li key={m.id} className="border-b border-line last:border-0">
							<button
								onMouseDown={() => goToMatch(m.id)}
								className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors text-sm"
							>
								<span className="font-mono text-blue mr-2 text-xs">{m.cedula ?? "—"}</span>
								<span className="text-ink">
									{m.homeTeamName} vs {m.awayTeamName}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
