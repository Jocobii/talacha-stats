import { getTranslations } from "next-intl/server";
import { ClipboardList, ArrowRight, ArrowDown, Trophy, ImageIcon, ListOrdered } from "lucide-react";

/* Datos ficticios del mock — claramente de ejemplo, no prueba social */
const CEDULA_ROWS = [
	{ name: "M. Chávez · #9", stat: "⚽ 2" },
	{ name: "J. Núñez · #11", stat: "⚽ 1" },
	{ name: "R. Ramírez · #4", stat: "🟨" },
];

const TABLE_ROWS = [
	{ pos: "1", team: "Deportivo", pts: "12" },
	{ pos: "2", team: "La Máquina", pts: "10" },
	{ pos: "3", team: "Atlético TJ", pts: "9" },
];

/** O2 — antes/después: una imagen del resultado vale más que una lista de features. */
export default async function OrganizerBeforeAfter() {
	const t = await getTranslations("home");

	return (
		<section className="bg-surface border-t border-line px-5 py-16">
			<div className="max-w-4xl mx-auto">
				<h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-center mb-2">
					{t("organizerBeforeAfter.titlePrefix")}{" "}
					<span className="text-brand-ink">{t("organizerBeforeAfter.titleStrong")}</span>
				</h2>
				<p className="text-ink-3 text-sm text-center mb-10 max-w-md mx-auto">
					{t("organizerBeforeAfter.subtext")}
				</p>

				<div className="flex flex-col lg:flex-row items-center gap-6">
					{/* ── Antes: la cédula en el celular ── */}
					<div className="w-full lg:flex-1 bg-pitch border border-line rounded-2xl p-5">
						<div className="flex items-center gap-2 mb-4">
							<ClipboardList size={16} strokeWidth={2} className="text-brand-ink" />
							<p className="text-xs font-bold uppercase tracking-widest text-ink-2">
								Cédula · Jornada 5 · TIJ-0037
							</p>
						</div>
						<ul className="space-y-2">
							{CEDULA_ROWS.map(({ name, stat }) => (
								<li
									key={name}
									className="flex items-center justify-between bg-surface-2 border border-line rounded-xl px-3.5 py-2.5 text-sm"
								>
									<span className="text-ink-2">{name}</span>
									<span className="font-bold text-ink">{stat}</span>
								</li>
							))}
						</ul>
						<p className="text-right text-sm font-display font-black text-ink mt-4">
							Marcador final: 3 – 1
						</p>
					</div>

					{/* Flecha responsive */}
					<div className="shrink-0 text-brand-ink" aria-hidden="true">
						<ArrowRight size={28} strokeWidth={2} className="hidden lg:block" />
						<ArrowDown size={28} strokeWidth={2} className="lg:hidden" />
					</div>

					{/* ── Después: lo que se genera solo ── */}
					<div className="w-full lg:flex-1 flex flex-col gap-3">
						<div className="bg-pitch border border-line rounded-2xl p-4">
							<div className="flex items-center gap-2 mb-3">
								<ListOrdered size={14} strokeWidth={2} className="text-brand-ink" />
								<p className="text-[11px] font-bold uppercase tracking-widest text-ink-2">
									{t("organizerBeforeAfter.standingsLabel")}
								</p>
							</div>
							<ul className="space-y-1.5">
								{TABLE_ROWS.map(({ pos, team, pts }) => (
									<li key={team} className="flex items-center gap-3 text-sm">
										<span className="w-5 font-display font-black text-brand-ink">{pos}</span>
										<span className="flex-1 text-ink-2">{team}</span>
										<span className="font-bold text-ink">{pts} pts</span>
									</li>
								))}
							</ul>
						</div>

						<div className="bg-pitch border border-line rounded-2xl p-4 flex items-center gap-3">
							<Trophy size={16} strokeWidth={2} className="text-brand-ink shrink-0" />
							<p className="text-sm text-ink-2">
								{t("organizerBeforeAfter.goleoUpdatedPrefix")}
								<strong className="text-ink">M. Chávez — 12 goles</strong>
							</p>
						</div>

						<div className="bg-brand/10 border border-brand/25 rounded-2xl p-4 flex items-center gap-3">
							<ImageIcon size={16} strokeWidth={2} className="text-brand-ink shrink-0" />
							<p className="text-sm text-ink-2">
								{t("organizerBeforeAfter.shareImagePrefix")}
								<strong className="text-ink">{t("organizerBeforeAfter.shareImageStrong")}</strong>
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
