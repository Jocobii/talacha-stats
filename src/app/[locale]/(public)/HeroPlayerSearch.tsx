"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n/navigation";
import { Search } from "lucide-react";

/**
 * J1 — buscador de nombre en el hero (auto-referencia: el visitante que llega
 * por un link compartido busca una sola cosa: él mismo).
 */
export default function HeroPlayerSearch() {
	const t = useTranslations("home");
	const router = useRouter();
	const [name, setName] = useState("");

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const query = name.trim();
		router.push(query ? `/players?q=${encodeURIComponent(query)}` : "/players");
	};

	return (
		<form
			onSubmit={handleSubmit}
			role="search"
			aria-label={t("heroSearch.ariaLabel")}
			className="w-full max-w-sm"
		>
			<p className="text-sm font-semibold text-ink mb-2">{t("heroSearch.label")}</p>
			<div className="relative">
				<Search
					size={16}
					strokeWidth={2}
					className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
				/>
				<input
					type="text"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder={t("heroSearch.placeholder")}
					aria-label={t("heroSearch.inputAriaLabel")}
					className="w-full bg-surface-2 border border-line rounded-2xl pl-11 pr-24 py-3.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
				/>
				<button
					type="submit"
					className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand hover:bg-brand-dim text-pitch font-bold text-xs px-4 py-2.5 rounded-xl transition"
				>
					{t("heroSearch.submit")}
				</button>
			</div>
		</form>
	);
}
