"use client";

import { useTranslations } from "next-intl";
import { MapPin, Plus } from "lucide-react";
import { VENUES } from "../mock";
import { CoordHeader } from "../ui/CoordHeader";

export function CanchasTab() {
	const t = useTranslations("demo");
	return (
		<div className="flex flex-col flex-1">
			<CoordHeader
				icon={MapPin}
				title={t("canchas.title")}
				subtitle={t("canchas.subtitle", { count: VENUES.length })}
			/>
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-12">
				<div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{VENUES.map((v) => {
						const inUse = v.ligasCount > 0;
						return (
							<article
								key={v.id}
								className="bg-surface-2 border border-line rounded-xl overflow-hidden flex flex-col"
							>
								<div style={{ height: 6, background: v.color, opacity: 0.85 }} />
								<div className="p-4 flex flex-col flex-1">
									<h3 className="font-display font-bold text-[22px] leading-none tracking-tight text-ink">
										{v.name}
									</h3>
									<p className="flex items-center gap-1 mt-2 text-xs text-ink-2 truncate">
										<MapPin size={11} className="text-ink-3 shrink-0" />
										{v.address}
									</p>

									<div className="h-px bg-line my-3.5" />

									<div className="flex items-center gap-4">
										<div>
											<p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">
												{t("canchas.ligas")}
											</p>
											<div className="flex items-baseline gap-1 mt-1">
												<span
													className={`font-display text-[22px] leading-none font-black ${inUse ? "text-brand-ink" : "text-ink"}`}
												>
													{v.ligasCount}
												</span>
												<span className="text-[11px] text-ink-3">{t("canchas.active")}</span>
											</div>
										</div>
										<div>
											<p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">
												{t("canchas.windows")}
											</p>
											<div className="flex items-baseline gap-1 mt-1">
												<span className="font-display text-[22px] leading-none font-black text-ink">
													{v.windows}
												</span>
												<span className="text-[11px] text-ink-3">{t("canchas.slots")}</span>
											</div>
										</div>
										<div className="ml-auto">
											{inUse ? (
												<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand-ink">
													● {t("canchas.inUse")}
												</span>
											) : (
												<span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface border border-line text-ink-3">
													{t("canchas.unassigned")}
												</span>
											)}
										</div>
									</div>

									{inUse && (
										<div className="mt-3.5 flex flex-wrap gap-1.5">
											{v.ligas.map((l) => (
												<span
													key={l}
													className="text-[11px] px-2 py-0.5 rounded bg-surface border border-line text-ink-2"
												>
													{l}
												</span>
											))}
										</div>
									)}
								</div>
							</article>
						);
					})}

					{/* Add tile */}
					<button className="bg-transparent border border-dashed border-line rounded-xl min-h-[180px] flex flex-col items-center justify-center gap-2.5 text-ink-2 hover:border-brand/40 hover:bg-brand/5 transition group">
						<span className="w-10 h-10 rounded-full bg-brand/10 text-brand-ink grid place-items-center group-hover:bg-brand/20 transition">
							<Plus size={20} strokeWidth={2.5} />
						</span>
						<span className="text-[13.5px] font-semibold text-ink">{t("canchas.add")}</span>
						<span className="text-xs text-ink-3">{t("canchas.addHint")}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
