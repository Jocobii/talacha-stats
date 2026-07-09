"use client";

import { useTranslations } from "next-intl";
import { Shuffle, RotateCcw, Check, ArrowLeftRight, Lock, Plus, MapPin } from "lucide-react";
import { SORTEO } from "../mock";
import { CoordHeader } from "../ui/CoordHeader";
import { SorteoShareAnimation } from "../ui/SorteoShareAnimation";

export function SorteoTab() {
	const t = useTranslations("demo");
	return (
		<div className="flex flex-col flex-1">
			<CoordHeader
				icon={Shuffle}
				title={t("sorteo.title")}
				subtitle={t("sorteo.subtitle", { jornada: SORTEO.jornada })}
			/>
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-12">
				<div className="max-w-4xl mx-auto space-y-6">
					{/* Showcase animado: generar sorteo + compartir a WhatsApp */}
					<SorteoShareAnimation />

					<section className="bg-surface-2 border border-line rounded-xl overflow-hidden">
						{/* Toolbar */}
						<div className="px-4 py-3.5 border-b border-line flex items-center gap-2.5 flex-wrap">
							<h2 className="font-display font-black text-lg tracking-tight text-ink mr-1">
								{t("sorteo.previewEditable")}
							</h2>
							<span className="text-[11px] px-2.5 py-1 rounded-full bg-brand/10 text-brand-ink border border-brand/25">
								{t("sorteo.noRepeat", { count: SORTEO.noRepeat })}
							</span>
							<span className="text-[11px] px-2.5 py-1 rounded-full bg-surface border border-line text-ink-2">
								{t("sorteo.fixedSlots", { count: SORTEO.fixedSlots })}
							</span>
							<div className="ml-auto flex items-center gap-3">
								<span className="hidden sm:flex items-center gap-1.5 text-[11px] text-brand-ink">
									<Check size={12} /> {t("sorteo.saved")}
								</span>
								<button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
									<RotateCcw size={13} /> {t("sorteo.regenerate")}
								</button>
							</div>
						</div>

						{/* Edit hint */}
						<p className="px-4 py-2 text-[11px] italic text-ink-3 border-b border-line bg-pitch">
							{t("sorteo.editHint")}
						</p>

						{/* Pairings table */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
								<thead>
									<tr className="bg-pitch">
										<th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
											#
										</th>
										<th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
											{t("sorteo.home")}
										</th>
										<th className="px-2 py-2.5 w-7" />
										<th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
											{t("sorteo.away")}
										</th>
										<th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
											{t("sorteo.venue")}
										</th>
										<th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
											{t("sorteo.time")}
										</th>
										<th className="px-3 py-2.5 w-16" />
									</tr>
								</thead>
								<tbody>
									{SORTEO.pairings.map((p, idx) => (
										<tr key={idx} className="border-t border-line hover:bg-pitch/60 transition">
											<td className="px-3 py-2.5 text-[11px] text-ink-3 tabular-nums">
												{String(idx + 1).padStart(2, "0")}
											</td>
											<td className="px-3 py-2.5 text-right font-medium text-ink">{p.home}</td>
											<td className="px-2 py-2.5 text-center text-[10px] text-ink-3">vs</td>
											<td className="px-3 py-2.5 font-medium text-ink">{p.away}</td>
											<td className="px-3 py-2.5">
												<span className="inline-flex items-center gap-1.5 text-xs text-ink-2 bg-pitch border border-line rounded-md px-2 py-1">
													<MapPin size={11} className="text-ink-3" />
													{p.venue}
												</span>
											</td>
											<td className="px-3 py-2.5">
												<span
													className={`inline-flex items-center gap-1.5 text-xs rounded-md px-2 py-1 border ${p.fixed ? "bg-amber/10 text-amber border-amber/25" : "bg-pitch text-ink-2 border-line"}`}
												>
													{p.fixed && <Lock size={10} />}
													{p.time}
												</span>
											</td>
											<td className="px-3 py-2.5">
												<div className="flex gap-1.5 justify-end text-ink-3">
													<span className="w-6 h-6 grid place-items-center rounded-md border border-line hover:text-ink hover:border-line-2 transition">
														<ArrowLeftRight size={11} />
													</span>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Footer */}
						<div className="px-4 py-2.5 border-t border-line flex items-center justify-between bg-pitch">
							<div className="flex gap-2 text-xs text-ink-2">
								<span>
									<b className="text-ink">{SORTEO.pairings.length}</b> {t("sorteo.generatedShort")}
								</span>
								<span className="text-ink-3">·</span>
								<span>
									<b className="text-ink">{SORTEO.venuesCount}</b> {t("sorteo.venuesShort")}
								</span>
							</div>
							<button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>
								<Plus size={11} /> {t("sorteo.addManual")}
							</button>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
