"use client";

import { useTranslations } from "next-intl";
import { CalendarClock, Lock } from "lucide-react";
import { APARTADO } from "../mock";
import { CoordHeader } from "../ui/CoordHeader";

export function ApartadoTab() {
	const t = useTranslations("demo");
	const booked = APARTADO.grid.flat().filter(Boolean).length;
	const total = APARTADO.grid.length * APARTADO.times.length;
	const free = total - booked;
	const revenue = booked * APARTADO.price;

	return (
		<div className="flex flex-col flex-1">
			<CoordHeader
				icon={CalendarClock}
				title={t("apartado.title")}
				subtitle={t("apartado.subtitle", { venue: APARTADO.venue })}
			/>
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-6 pb-12">
				<div className="max-w-4xl mx-auto space-y-4">
					{/* Summary chips */}
					<div className="grid grid-cols-3 gap-3">
						<div className="bg-surface-2 border border-line rounded-xl p-3.5 text-center">
							<p className="font-display font-black text-3xl text-brand-ink leading-none">
								{booked}
							</p>
							<p className="text-[11px] text-ink-3 mt-1">{t("apartado.summaryBooked")}</p>
						</div>
						<div className="bg-surface-2 border border-line rounded-xl p-3.5 text-center">
							<p className="font-display font-black text-3xl text-ink leading-none">
								${revenue.toLocaleString("es-MX")}
							</p>
							<p className="text-[11px] text-ink-3 mt-1">{t("apartado.summaryRevenue")}</p>
						</div>
						<div className="bg-surface-2 border border-line rounded-xl p-3.5 text-center">
							<p className="font-display font-black text-3xl text-ink-2 leading-none">{free}</p>
							<p className="text-[11px] text-ink-3 mt-1">{t("apartado.summaryFree")}</p>
						</div>
					</div>

					{/* Weekly grid */}
					<div className="bg-surface-2 border border-line rounded-xl overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full border-collapse min-w-[560px]">
								<thead>
									<tr>
										<th className="w-16 px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-3 bg-pitch">
											{t("sorteo.time")}
										</th>
										{APARTADO.days.map((d) => (
											<th
												key={d}
												className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-2 bg-pitch border-l border-line"
											>
												{d}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{APARTADO.times.map((time, ti) => (
										<tr key={time} className="border-t border-line">
											<td className="px-2 py-1.5 text-xs text-ink-3 tabular-nums align-middle bg-pitch">
												{time}
											</td>
											{APARTADO.days.map((d, di) => {
												const team = APARTADO.grid[di][ti];
												return (
													<td key={d} className="border-l border-line p-1 align-middle">
														{team ? (
															<div className="rounded-lg bg-brand/10 border border-brand/25 px-2 py-1.5 text-center">
																<p className="text-[11px] font-semibold text-brand-ink leading-tight truncate">
																	{team}
																</p>
																<p className="text-[9px] text-ink-3 mt-0.5">${APARTADO.price}</p>
															</div>
														) : (
															<div className="rounded-lg border border-dashed border-line px-2 py-1.5 text-center">
																<p className="text-[10px] text-ink-3">{t("apartado.free")}</p>
															</div>
														)}
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{/* Legend */}
						<div className="px-4 py-3 border-t border-line flex items-center gap-4 text-[11px] text-ink-3 flex-wrap bg-pitch">
							<span className="flex items-center gap-1.5">
								<span className="w-3 h-3 rounded bg-brand/20 border border-brand/25" />
								{t("apartado.booked")}
							</span>
							<span className="flex items-center gap-1.5">
								<span className="w-3 h-3 rounded border border-dashed border-line" />
								{t("apartado.free")}
							</span>
							<span className="ml-auto flex items-center gap-1.5 text-brand-ink">
								<Lock size={11} /> {t("apartado.legend")}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
