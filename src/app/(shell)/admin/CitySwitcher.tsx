"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Search } from "lucide-react";
import { MEXICO_CITIES } from "@/shared/lib/cities";
import { apiFetch } from "@/shared/api/client";

type Props = { activeCity: string };

export default function CitySwitcher({ activeCity }: Props) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const container = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (container.current && !container.current.contains(e.target as Node)) {
				setOpen(false);
				setQuery("");
			}
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const filtered = query.trim()
		? MEXICO_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
		: MEXICO_CITIES;

	async function selectCity(city: string) {
		if (city === activeCity) {
			setOpen(false);
			return;
		}
		try {
			const result = await apiFetch("/api/auth/city", {
				method: "POST",
				body: { city },
			});
			if (result.ok) {
				window.location.reload();
			}
		} catch (networkError) {
			console.error("[CitySwitcher] selectCity", networkError);
		}
	}

	return (
		<div ref={container} className="relative">
			<button
				onClick={() => {
					setOpen((v) => !v);
					setQuery("");
				}}
				className="flex items-center gap-1.5 bg-surface/10 hover:bg-surface/20 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
				aria-expanded={open}
				aria-haspopup="listbox"
			>
				<MapPin size={12} strokeWidth={2} />
				<span>{activeCity}</span>
				<ChevronDown
					size={12}
					strokeWidth={2}
					className={`transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="absolute right-0 top-full mt-1.5 w-60 bg-surface border border-line rounded-xl shadow-2xl z-50 overflow-hidden">
					{/* Search */}
					<div className="p-2 border-b border-line">
						<div className="relative">
							<Search
								size={12}
								className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none"
							/>
							<input
								autoFocus
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Buscar ciudad…"
								className="w-full bg-surface-2 text-white text-sm placeholder-gray-500 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand"
							/>
						</div>
					</div>

					{/* List */}
					<ul
						role="listbox"
						aria-label="Seleccionar ciudad"
						className="max-h-64 overflow-y-auto py-1"
					>
						{filtered.length === 0 ? (
							<li className="px-3 py-2 text-sm text-ink-2 text-center">Sin resultados</li>
						) : (
							filtered.map((city) => (
								<li key={city} role="option" aria-selected={city === activeCity}>
									<button
										onClick={() => selectCity(city)}
										className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition
                      ${
												city === activeCity
													? "bg-brand/15 text-brand-ink"
													: "text-ink hover:bg-surface-2"
											}`}
									>
										{city}
										{city === activeCity && <Check size={12} strokeWidth={2} />}
									</button>
								</li>
							))
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
