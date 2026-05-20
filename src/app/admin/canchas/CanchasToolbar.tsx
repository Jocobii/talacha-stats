"use client";

import { Search } from "lucide-react";

type ViewMode = "cards" | "list";

type CanchasToolbarProps = {
	query: string;
	view: ViewMode;
	onQueryChange: (q: string) => void;
	onViewChange: (v: ViewMode) => void;
};

export function CanchasToolbar({ query, view, onQueryChange, onViewChange }: CanchasToolbarProps) {
	return (
		<div className="flex items-center gap-2.5 mb-4">
			{/* Search */}
			<div className="flex items-center gap-2 flex-1 max-w-sm h-9 bg-surface border border-line rounded-lg px-3">
				<Search size={13} className="text-ink-3 shrink-0" />
				<input
					type="search"
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="Buscar por nombre o dirección…"
					className="flex-1 bg-transparent border-none outline-none text-ink text-[13.5px] placeholder:text-ink-3"
				/>
			</div>

			{/* View toggle */}
			<div className="ml-auto flex items-center gap-2">
				<span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-3">
					Vista
				</span>
				<div className="flex bg-surface border border-line rounded-lg p-0.5">
					<ViewPill active={view === "cards"} onClick={() => onViewChange("cards")}>
						Tarjetas
					</ViewPill>
					<ViewPill active={view === "list"} onClick={() => onViewChange("list")}>
						Lista
					</ViewPill>
				</div>
			</div>
		</div>
	);
}

function ViewPill({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className={`px-2.5 py-1 text-[11.5px] font-semibold rounded-md transition-colors ${
				active ? "bg-surface-2 text-ink" : "text-ink-3 hover:text-ink"
			}`}
		>
			{children}
		</button>
	);
}
