"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/shared/i18n/navigation";
import { useCities } from "@/shared/hooks/useCities";

function CityFilterInner() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const current = params.get("city") ?? "Tijuana";
	const t = useTranslations("common");

	const { data: cities = [] } = useCities();

	function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const next = new URLSearchParams(params.toString());
		next.set("city", e.target.value);
		router.push(`${pathname}?${next.toString()}`);
	}

	// While loading, show a non-interactive label so layout doesn't shift
	if (cities.length === 0) {
		return (
			<div className="flex items-center gap-1.5">
				<MapPin size={12} className="text-ink-3 shrink-0" strokeWidth={2} />
				<span className="bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5">
					{current}
				</span>
			</div>
		);
	}

	// If the current city isn't in the list (e.g. stale URL), show it anyway so the
	// select doesn't show a blank value — the user can then pick a valid one.
	const options = cities.includes(current) ? cities : [current, ...cities];

	return (
		<div className="flex items-center gap-1.5">
			<MapPin size={12} className="text-ink-3 shrink-0" strokeWidth={2} />
			<select
				value={current}
				onChange={handleChange}
				className="bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
			>
				{options.map((c) => (
					<option key={c} value={c}>
						{c}
					</option>
				))}
			</select>
		</div>
	);
}

export default function CityFilter() {
	const t = useTranslations("common");
	return (
		<Suspense
			fallback={
				<div className="flex items-center gap-1.5">
					<MapPin size={12} className="text-ink-3 shrink-0" strokeWidth={2} />
					<span className="bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5">
						{t("cityFilter.loading")}
					</span>
				</div>
			}
		>
			<CityFilterInner />
		</Suspense>
	);
}
